import { PrismaClient, HiringMode } from "@prisma/client";
import { SmartMatchingService } from "./smart-matching.service";

export class JobPostingService {
  private prisma: PrismaClient;
  private matchingService: SmartMatchingService;

  constructor() {
    this.prisma = new PrismaClient();
    this.matchingService = new SmartMatchingService();
  }

  /**
   * Create job posting
   */
  async createJobPosting(
    userId: string,
    data: {
      title: string;
      description: string;
      hiringMode: HiringMode;
      requiredSkills: string[];
      experienceLevel: string;
      budgetMin?: number;
      budgetMax?: number;
      currency?: string;
      ctcMin?: number;
      ctcMax?: number;
      duration?: number;
      stipend?: number;
      estimatedHours?: number;
      isTimeBoxed?: boolean;
      endDate?: Date;
      projectScope?: string;
      milestones?: any[];
      location?: string;
      isRemote?: boolean;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { companyProfile: true },
    });

    if (!user || !user.companyProfile) {
      throw new Error("Company profile not found");
    }

    if (user.role !== "company") {
      throw new Error("Only companies can post jobs");
    }

    const jobPosting = await this.prisma.jobPosting.create({
      data: {
        companyProfileId: user.companyProfile.id,
        userId,
        title: data.title,
        description: data.description,
        hiringMode: data.hiringMode,
        requiredSkills: data.requiredSkills,
        experienceLevel: data.experienceLevel,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        currency: data.currency || "INR",
        ctcMin: data.ctcMin,
        ctcMax: data.ctcMax,
        duration: data.duration,
        stipend: data.stipend,
        estimatedHours: data.estimatedHours,
        isTimeBoxed: data.isTimeBoxed || false,
        endDate: data.endDate,
        projectScope: data.projectScope,
        milestones: data.milestones || undefined,
        location: data.location,
        isRemote: data.isRemote ?? true,
        status: "open",
      },
    });

    // Generate smart matches
    await this.matchingService.generateMatches(jobPosting.id);

    return jobPosting;
  }

  /**
   * Get job posting with matches
   */
  async getJobPosting(jobPostingId: string, _userId?: string) {
    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      include: {
        companyProfile: {
          select: {
            companyName: true,
            logoUrl: true,
            location: true,
            trustScore: true,
            websiteVerified: true,
          },
        },
        _count: {
          select: {
            applications: true,
            smartMatches: true,
          },
        },
      },
    });

    if (!jobPosting) {
      throw new Error("Job posting not found");
    }

    // Increment view count
    await this.prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: { viewCount: { increment: 1 } },
    });

    return jobPosting;
  }

  /**
   * Get smart matches for job
   */
  async getJobMatches(jobPostingId: string, userId: string) {
    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
    });

    if (!jobPosting) {
      throw new Error("Job posting not found");
    }

    if (jobPosting.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return await this.matchingService.getJobMatches(jobPostingId);
  }

  /**
   * Apply to job
   */
  async applyToJob(
    jobPostingId: string,
    userId: string,
    data: {
      coverLetter: string;
      proposedRate?: number;
      availability?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { engineerProfile: true },
    });

    if (!user || !user.engineerProfile) {
      throw new Error("Engineer profile not found");
    }

    if (user.role !== "engineer") {
      throw new Error("Only engineers can apply to jobs");
    }

    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
    });

    if (!jobPosting) {
      throw new Error("Job posting not found");
    }

    if (jobPosting.status !== "open") {
      throw new Error("Job posting is not open for applications");
    }

    // Check if already applied
    const existing = await this.prisma.jobApplication.findFirst({
      where: {
        jobPostingId,
        engineerProfileId: user.engineerProfile.id,
      },
    });

    if (existing) {
      throw new Error("Already applied to this job");
    }

    const application = await this.prisma.jobApplication.create({
      data: {
        jobPostingId,
        engineerProfileId: user.engineerProfile.id,
        userId,
        coverLetter: data.coverLetter,
        proposedRate: data.proposedRate,
        availability: data.availability,
        status: "pending",
      },
    });

    // Update application count
    await this.prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: { applicationCount: { increment: 1 } },
    });

    return application;
  }

  /**
   * Get job applications
   */
  async getJobApplications(jobPostingId: string, userId: string) {
    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
    });

    if (!jobPosting) {
      throw new Error("Job posting not found");
    }

    if (jobPosting.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return await this.prisma.jobApplication.findMany({
      where: { jobPostingId },
      include: {
        engineerProfile: {
          select: {
            id: true,
            fullName: true,
            bio: true,
            location: true,
            neuronScore: true,
            neuronTier: true,
            hourlyRate: true,
            skills: {
              select: {
                skillName: true,
                proficiencyLevel: true,
              },
            },
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    applicationId: string,
    userId: string,
    status: "shortlisted" | "rejected" | "accepted",
  ) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { jobPosting: true },
    });

    if (!application) {
      throw new Error("Application not found");
    }

    if (application.jobPosting.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Search job postings
   */
  async searchJobs(filters: {
    hiringMode?: HiringMode;
    skills?: string[];
    experienceLevel?: string;
    minBudget?: number;
    maxBudget?: number;
    isRemote?: boolean;
    location?: string;
    query?: string;
    limit?: number;
    cursor?: string;
  }) {
    const where: any = {
      status: "open",
    };

    if (filters.hiringMode) {
      where.hiringMode = filters.hiringMode;
    }

    if (filters.skills && filters.skills.length > 0) {
      where.requiredSkills = {
        hasSome: filters.skills,
      };
    }

    if (filters.experienceLevel) {
      where.experienceLevel = filters.experienceLevel;
    }

    if (filters.minBudget || filters.maxBudget) {
      where.budgetMax = {};
      if (filters.minBudget) {
        where.budgetMax.gte = filters.minBudget;
      }
      if (filters.maxBudget) {
        where.budgetMax.lte = filters.maxBudget;
      }
    }

    if (filters.isRemote !== undefined) {
      where.isRemote = filters.isRemote;
    }

    if (filters.location) {
      where.location = {
        contains: filters.location,
        mode: "insensitive",
      };
    }

    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: "insensitive" } },
        { description: { contains: filters.query, mode: "insensitive" } },
      ];
    }

    const limit = filters.limit || 20;
    const cursorCondition = filters.cursor ? { id: filters.cursor } : undefined;

    const jobs = await this.prisma.jobPosting.findMany({
      where,
      take: limit + 1,
      skip: filters.cursor ? 1 : 0,
      cursor: cursorCondition,
      include: {
        companyProfile: {
          select: {
            companyName: true,
            logoUrl: true,
            trustScore: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { postedAt: "desc" },
    });

    const hasMore = jobs.length > limit;
    const items = hasMore ? jobs.slice(0, -1) : jobs;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Close job posting
   */
  async closeJobPosting(jobPostingId: string, userId: string) {
    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
    });

    if (!jobPosting) {
      throw new Error("Job posting not found");
    }

    if (jobPosting.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return await this.prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        status: "closed",
        closedAt: new Date(),
      },
    });
  }

  /**
   * Get company's job postings
   */
  async getCompanyJobPostings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { companyProfile: true },
    });

    if (!user || !user.companyProfile) {
      throw new Error("Company profile not found");
    }

    return await this.prisma.jobPosting.findMany({
      where: { companyProfileId: user.companyProfile.id },
      include: {
        _count: {
          select: {
            applications: true,
            smartMatches: true,
          },
        },
      },
      orderBy: { postedAt: "desc" },
    });
  }

  /**
   * Get engineer's applications
   */
  async getEngineerApplications(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { engineerProfile: true },
    });

    if (!user || !user.engineerProfile) {
      throw new Error("Engineer profile not found");
    }

    return await this.prisma.jobApplication.findMany({
      where: { engineerProfileId: user.engineerProfile.id },
      include: {
        jobPosting: {
          include: {
            companyProfile: {
              select: {
                companyName: true,
                logoUrl: true,
              },
            },
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });
  }
}
