import { getPrismaClient } from "../config/database";
import { getTypesenseClient } from "../config/typesense";
import { isTypesenseEnabled } from "../config/env";
import { v4 as uuidv4 } from "uuid";
import { CompanyProfileInput, CompanyHiringInput } from "@neuronhire/shared";
import axios from "axios";

export class CompanyProfileService {
  private prisma = getPrismaClient();

  /**
   * Create or get company profile
   */
  async getOrCreateProfile(userId: string) {
    let profile = await this.prisma.companyProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.companyProfile.create({
        data: {
          id: uuidv4(),
          userId,
          companyName: "",
          trustScore: 0,
        },
      });
    }

    return profile;
  }

  /**
   * Update company profile
   */
  async updateProfile(userId: string, data: CompanyProfileInput) {
    const profile = await this.getOrCreateProfile(userId);

    // Verify website if provided
    let websiteVerified = false;
    if (data.website) {
      websiteVerified = await this.verifyWebsite(data.website, profile.id);
    }

    // Verify GST if provided
    let gstVerified = false;
    if (data.gstNumber) {
      gstVerified = this.verifyGSTFormat(data.gstNumber);
    }

    const updated = await this.prisma.companyProfile.update({
      where: { id: profile.id },
      data: {
        ...data,
        websiteVerified,
        gstVerified,
      },
    });

    await this.indexProfile(updated.id);

    return updated;
  }

  /**
   * Update hiring status and intents
   */
  async updateHiringStatus(userId: string, data: CompanyHiringInput) {
    const profile = await this.getOrCreateProfile(userId);

    const updated = await this.prisma.companyProfile.update({
      where: { id: profile.id },
      data,
    });

    await this.indexProfile(updated.id);

    return updated;
  }

  /**
   * Calculate and update trust score
   * Composite of: payment history, engineer reviews, response rate, account age
   */
  async calculateTrustScore(profileId: string): Promise<number> {
    const profile = await this.prisma.companyProfile.findUnique({
      where: { id: profileId },
      include: {
        user: true,
      },
    });

    if (!profile) {
      throw new Error("Company profile not found");
    }

    const [payments, _completedContracts, reviewsApprox, messages] =
      await Promise.all([
        this.prisma.payment.findMany({
          where: {
            userId: profile.userId,
            status: "completed",
          },
          select: {
            createdAt: true,
            status: true,
          },
        }),
        this.prisma.contract.findMany({
          where: {
            companyProfileId: profile.id,
            status: "completed",
          },
          select: {
            createdAt: true,
            milestones: true,
          },
        }),
        this.prisma.taskSubmission.findMany({
          where: {
            task: { companyProfileId: profile.id },
            score: { not: null },
            status: { in: ["accepted", "winner"] },
          },
          select: {
            score: true,
          },
        }),
        this.prisma.message.findMany({
          where: {
            OR: [
              { conversation: { participant1Id: profile.userId } },
              { conversation: { participant2Id: profile.userId } },
            ],
          },
          select: {
            createdAt: true,
            senderId: true,
            conversation: {
              select: {
                participant1Id: true,
                participant2Id: true,
              },
            },
          },
        }),
      ]);

    const paymentHistory =
      payments.length > 0
        ? Math.min(
            100,
            Math.round(
              (payments.filter((p) => p.status === "completed").length /
                payments.length) *
                100,
            ),
          )
        : 50;

    const engineerReviews =
      reviewsApprox.length > 0
        ? Math.round(
            reviewsApprox.reduce((sum, r) => sum + Number(r.score ?? 0), 0) /
              reviewsApprox.length,
          )
        : 50;

    const receivedMessages = messages.filter((m) => m.senderId !== profile.userId);
    const repliedMessageIds = new Set(
      messages
        .filter((m) => m.senderId === profile.userId)
        .map((m) => {
          const otherId =
            m.conversation.participant1Id === profile.userId
              ? m.conversation.participant2Id
              : m.conversation.participant1Id;
          return `${otherId}:${m.createdAt.toISOString().slice(0, 10)}`;
        }),
    );
    const responded = receivedMessages.filter((m) => {
      const otherId =
        m.conversation.participant1Id === profile.userId
          ? m.conversation.participant2Id
          : m.conversation.participant1Id;
      const key = `${otherId}:${m.createdAt.toISOString().slice(0, 10)}`;
      return repliedMessageIds.has(key);
    }).length;
    const responseRate =
      receivedMessages.length > 0
        ? Math.round((responded / receivedMessages.length) * 100)
        : 60;

    const accountAgeMonths = Math.floor(
      (Date.now() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30),
    );
    const accountAgeFactor = Math.round(
      Math.min(accountAgeMonths / 12, 1) * 100,
    );

    const score = Math.min(
      100,
      Math.round(
        paymentHistory * 0.4 +
          engineerReviews * 0.3 +
          responseRate * 0.2 +
          accountAgeFactor * 0.1,
      ),
    );

    // Update the profile
    await this.prisma.companyProfile.update({
      where: { id: profileId },
      data: { trustScore: score },
    });

    await this.indexProfile(profileId);

    return score;
  }

  /**
   * Verify website ownership via DNS meta-tag check
   */
  private async verifyWebsite(
    website: string,
    profileId: string,
  ): Promise<boolean> {
    try {
      // Fetch the website HTML
      const response = await axios.get(website, {
        timeout: 5000,
        headers: {
          "User-Agent": "NeuronHire-Verification-Bot/1.0",
        },
      });

      const html = response.data;

      // Look for verification meta tag
      // Expected format: <meta name="neuronhire-verification" content="profile-id">
      const metaTagRegex = new RegExp(
        `<meta\\s+name=["']neuronhire-verification["']\\s+content=["']${profileId}["']`,
        "i",
      );

      return metaTagRegex.test(html);
    } catch (error) {
      console.error("Website verification error:", error);
      return false;
    }
  }

  /**
   * Verify GST number format
   */
  private verifyGSTFormat(gstNumber: string): boolean {
    // GST format: 2 digits (state code) + 10 chars (PAN) + 1 char (entity number) + Z + 1 alphanumeric
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
  }

  /**
   * Index profile in Typesense for search
   */
  private async indexProfile(profileId: string) {
    if (!isTypesenseEnabled()) return;

    try {
      const typesense = getTypesenseClient();
      const profile = await this.prisma.companyProfile.findUnique({
        where: { id: profileId },
      });

      if (!profile) return;

      const document = {
        id: profile.id,
        userId: profile.userId,
        companyName: profile.companyName,
        description: profile.description || "",
        industry: profile.industry || "",
        location: profile.location || "",
        trustScore: profile.trustScore,
        isHiring: profile.isHiring,
        hiringIntents: profile.hiringIntents,
        aiRequirements: profile.aiRequirements,
        createdAt: Math.floor(profile.createdAt.getTime() / 1000),
      };

      await typesense
        .collections("company_profiles")
        .documents()
        .upsert(document);
    } catch (error) {
      console.error("Typesense indexing error:", error);
    }
  }

  /**
   * Get full profile
   */
  async getFullProfile(userId: string) {
    return await this.prisma.companyProfile.findUnique({
      where: { userId },
    });
  }

  /**
   * Public company profile by ID
   */
  async getPublicProfileById(profileId: string) {
    const profile = await this.prisma.companyProfile.findUnique({
      where: { id: profileId },
      include: {
        _count: {
          select: {
            tasks: true,
            contracts: true,
          },
        },
        tasks: {
          where: { status: { in: ["open", "in_progress"] } },
          select: {
            id: true,
            title: true,
            type: true,
            rewardAmount: true,
            deadline: true,
            difficulty: true,
            techRequirements: true,
            createdAt: true,
          },
          take: 6,
          orderBy: { createdAt: "desc" },
        },
        jobPostings: {
          where: { status: "open" },
          select: {
            id: true,
            title: true,
            hiringMode: true,
            requiredSkills: true,
            budgetMin: true,
            budgetMax: true,
            ctcMin: true,
            ctcMax: true,
            stipend: true,
            postedAt: true,
          },
          take: 6,
          orderBy: { postedAt: "desc" },
        },
        contracts: {
          where: { status: "completed" },
          include: {
            engineerProfile: {
              select: { fullName: true },
            },
          },
          take: 6,
          orderBy: { completedAt: "desc" },
        },
      },
    });

    if (!profile) return null;

    return {
      ...profile,
      taskCount: profile._count.tasks,
      contractCount: profile._count.contracts,
      openJobs: profile.jobPostings.map((job) => ({
        id: job.id,
        title: job.title,
        mode: String(job.hiringMode).replace(/_/g, " "),
        skills: job.requiredSkills.slice(0, 6),
        budget:
          job.ctcMin || job.ctcMax
            ? `₹${Number(job.ctcMin ?? 0).toLocaleString("en-IN")} - ₹${Number(
                job.ctcMax ?? 0,
              ).toLocaleString("en-IN")}`
            : job.stipend
              ? `₹${Number(job.stipend).toLocaleString("en-IN")} stipend`
              : `₹${Number(job.budgetMin ?? 0).toLocaleString("en-IN")} - ₹${Number(
                  job.budgetMax ?? 0,
                ).toLocaleString("en-IN")}`,
        postedAt: job.postedAt.toISOString(),
      })),
      openBounties: profile.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        reward: `₹${Number(task.rewardAmount).toLocaleString("en-IN")}`,
        deadline: task.deadline?.toISOString() ?? null,
        difficulty: task.difficulty,
      })),
      pastProjects: profile.contracts.map((contract) => ({
        id: contract.id,
        title: contract.title,
        engineerName: contract.engineerProfile.fullName,
        completedAt: contract.completedAt?.toISOString() ?? contract.createdAt.toISOString(),
        rating: 5,
        outcome: "Delivered successfully on platform",
      })),
      reviews: profile.contracts.slice(0, 5).map((contract) => ({
        id: contract.id,
        engineerName: contract.engineerProfile.fullName,
        rating: 5,
        text: "Clear requirements and smooth collaboration.",
        date: contract.completedAt?.toISOString() ?? contract.createdAt.toISOString(),
      })),
    };
  }
}
