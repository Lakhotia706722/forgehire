import { PrismaClient } from "@prisma/client";

export class SmartMatchingService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Compute skill match score between job and engineer
   * Uses simple keyword matching (in production, use sentence-transformers or similar)
   */
  private computeSkillMatchScore(
    requiredSkills: string[],
    engineerSkills: Array<{ skillName: string; proficiencyLevel: string }>,
  ): number {
    if (requiredSkills.length === 0) return 0;

    const engineerSkillNames = engineerSkills.map((s) =>
      s.skillName.toLowerCase(),
    );
    const matchedSkills = requiredSkills.filter((skill) =>
      engineerSkillNames.some(
        (es) =>
          es.includes(skill.toLowerCase()) || skill.toLowerCase().includes(es),
      ),
    );

    const baseScore = (matchedSkills.length / requiredSkills.length) * 100;

    // Bonus for proficiency levels
    const proficiencyBonus = engineerSkills
      .filter((s) =>
        matchedSkills.some((ms) =>
          s.skillName.toLowerCase().includes(ms.toLowerCase()),
        ),
      )
      .reduce((bonus, skill) => {
        const proficiencyScores: Record<string, number> = {
          expert: 10,
          advanced: 7,
          intermediate: 4,
          beginner: 2,
        };
        return bonus + (proficiencyScores[skill.proficiencyLevel] || 0);
      }, 0);

    return Math.min(100, baseScore + proficiencyBonus / requiredSkills.length);
  }

  /**
   * Check if budget fits engineer's rate
   */
  private checkBudgetFit(
    budgetMin: number | null,
    budgetMax: number | null,
    engineerMin: number | null,
    engineerMax: number | null,
  ): boolean {
    if (!budgetMin || !budgetMax || !engineerMin || !engineerMax) {
      return false;
    }

    // Check if ranges overlap
    return budgetMax >= engineerMin && budgetMin <= engineerMax;
  }

  /**
   * Check availability fit
   */
  private checkAvailabilityFit(
    engineerStatus: string,
    engineerAvailableInWeeks: number | null,
  ): boolean {
    if (engineerStatus === "available_now") return true;
    if (
      engineerStatus === "available_in_weeks" &&
      engineerAvailableInWeeks &&
      engineerAvailableInWeeks <= 4
    ) {
      return true;
    }
    return false;
  }

  /**
   * Generate smart matches for a job posting
   */
  async generateMatches(jobPostingId: string) {
    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
    });

    if (!jobPosting) {
      throw new Error("Job posting not found");
    }

    // Get all engineers with required skills
    const engineers = await this.prisma.engineerProfile.findMany({
      where: {
        skills: {
          some: {
            skillName: {
              in: jobPosting.requiredSkills,
            },
          },
        },
      },
      include: {
        skills: true,
      },
    });

    const matches = [];

    for (const engineer of engineers) {
      // Calculate skill match score
      const skillMatchScore = this.computeSkillMatchScore(
        jobPosting.requiredSkills,
        engineer.skills,
      );

      // Check budget fit
      const budgetFit = this.checkBudgetFit(
        jobPosting.budgetMin
          ? parseFloat(jobPosting.budgetMin.toString())
          : null,
        jobPosting.budgetMax
          ? parseFloat(jobPosting.budgetMax.toString())
          : null,
        engineer.minHourlyRate
          ? parseFloat(engineer.minHourlyRate.toString())
          : null,
        engineer.maxHourlyRate
          ? parseFloat(engineer.maxHourlyRate.toString())
          : null,
      );

      // Check availability fit
      const availabilityFit = this.checkAvailabilityFit(
        engineer.availabilityStatus,
        engineer.availableInWeeks,
      );

      // Only create match if skill score is above threshold
      if (skillMatchScore >= 40) {
        const matchDetails = {
          skillMatchScore,
          budgetFit,
          availabilityFit,
          matchedSkills: jobPosting.requiredSkills.filter((skill) =>
            engineer.skills.some((es) =>
              es.skillName.toLowerCase().includes(skill.toLowerCase()),
            ),
          ),
          neuronScore: engineer.neuronScore,
          neuronTier: engineer.neuronTier,
        };

        matches.push({
          jobPostingId,
          engineerProfileId: engineer.id,
          skillMatchScore,
          budgetFit,
          availabilityFit,
          matchDetails,
        });
      }
    }

    // Sort by skill match score
    matches.sort((a, b) => b.skillMatchScore - a.skillMatchScore);

    // Save top matches to database
    for (const match of matches.slice(0, 20)) {
      await this.prisma.smartMatch.upsert({
        where: {
          jobPostingId_engineerProfileId: {
            jobPostingId: match.jobPostingId,
            engineerProfileId: match.engineerProfileId,
          },
        },
        create: match,
        update: {
          skillMatchScore: match.skillMatchScore,
          budgetFit: match.budgetFit,
          availabilityFit: match.availabilityFit,
          matchDetails: match.matchDetails,
        },
      });
    }

    return matches;
  }

  /**
   * Get matches for a job posting
   */
  async getJobMatches(jobPostingId: string, limit = 10) {
    return await this.prisma.smartMatch.findMany({
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
            availabilityStatus: true,
            skills: {
              select: {
                skillName: true,
                proficiencyLevel: true,
              },
            },
          },
        },
      },
      orderBy: { skillMatchScore: "desc" },
      take: limit,
    });
  }

  /**
   * Instant Team Builder - suggest complementary engineers
   */
  async buildTeam(
    problemDescription: string,
    requiredSkills: string[],
    budget: number,
  ) {
    // Extract skill categories
    const skillCategories = this.categorizeSkills(requiredSkills);

    // Find engineers for each category
    const teamMembers = [];

    for (const category of skillCategories) {
      const engineer = await this.prisma.engineerProfile.findFirst({
        where: {
          skills: {
            some: {
              skillName: { in: category.skills },
            },
          },
          availabilityStatus: "available_now",
          maxHourlyRate: {
            lte: budget / skillCategories.length,
          },
        },
        include: {
          skills: true,
        },
        orderBy: {
          neuronScore: "desc",
        },
      });

      if (engineer) {
        teamMembers.push({
          engineer,
          category: category.name,
          skills: category.skills,
        });
      }
    }

    return {
      teamSize: teamMembers.length,
      members: teamMembers,
      estimatedCost: teamMembers.reduce((sum, member) => {
        return sum + parseFloat(member.engineer.hourlyRate?.toString() || "0");
      }, 0),
      skillCoverage: this.calculateSkillCoverage(teamMembers, requiredSkills),
    };
  }

  /**
   * Categorize skills into groups
   */
  private categorizeSkills(
    skills: string[],
  ): Array<{ name: string; skills: string[] }> {
    const categories: Record<string, string[]> = {
      frontend: [],
      backend: [],
      mobile: [],
      devops: [],
      ai_ml: [],
      design: [],
    };

    const categoryKeywords: Record<string, string[]> = {
      frontend: [
        "react",
        "vue",
        "angular",
        "javascript",
        "typescript",
        "html",
        "css",
        "nextjs",
      ],
      backend: [
        "node",
        "python",
        "java",
        "go",
        "rust",
        "django",
        "fastapi",
        "express",
      ],
      mobile: ["react native", "flutter", "swift", "kotlin", "ios", "android"],
      devops: [
        "docker",
        "kubernetes",
        "aws",
        "gcp",
        "azure",
        "terraform",
        "ci/cd",
      ],
      ai_ml: [
        "machine learning",
        "deep learning",
        "tensorflow",
        "pytorch",
        "nlp",
        "computer vision",
      ],
      design: ["ui", "ux", "figma", "sketch", "design"],
    };

    for (const skill of skills) {
      const skillLower = skill.toLowerCase();
      let categorized = false;

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some((keyword) => skillLower.includes(keyword))) {
          categories[category].push(skill);
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        categories.backend.push(skill); // Default to backend
      }
    }

    return Object.entries(categories)
      .filter(([_, skills]) => skills.length > 0)
      .map(([name, skills]) => ({ name, skills }));
  }

  /**
   * Calculate skill coverage
   */
  private calculateSkillCoverage(
    teamMembers: any[],
    requiredSkills: string[],
  ): number {
    const coveredSkills = new Set<string>();

    for (const member of teamMembers) {
      for (const skill of member.engineer.skills) {
        const matchedSkill = requiredSkills.find(
          (rs) =>
            skill.skillName.toLowerCase().includes(rs.toLowerCase()) ||
            rs.toLowerCase().includes(skill.skillName.toLowerCase()),
        );
        if (matchedSkill) {
          coveredSkills.add(matchedSkill);
        }
      }
    }

    return (coveredSkills.size / requiredSkills.length) * 100;
  }

  /**
   * Invite engineer to apply for job
   */
  async inviteEngineer(jobPostingId: string, engineerProfileId: string) {
    const match = await this.prisma.smartMatch.findUnique({
      where: {
        jobPostingId_engineerProfileId: {
          jobPostingId,
          engineerProfileId,
        },
      },
    });

    if (!match) {
      throw new Error("Match not found");
    }

    return await this.prisma.smartMatch.update({
      where: {
        jobPostingId_engineerProfileId: {
          jobPostingId,
          engineerProfileId,
        },
      },
      data: {
        invited: true,
        invitedAt: new Date(),
      },
    });
  }
}
