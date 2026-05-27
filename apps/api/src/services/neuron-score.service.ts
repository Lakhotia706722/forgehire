import { getPrismaClient } from "../config/database";
import { v4 as uuidv4 } from "uuid";

export interface ScoreDimensions {
  assessment: number; // 0-250 (25%)
  clientRatings: number; // 0-250 (25%)
  portfolioDepth: number; // 0-200 (20%)
  workDelivery: number; // 0-150 (15%)
  marketplace: number; // 0-100 (10%)
  community: number; // 0-50 (5%)
}

export class NeuronScoreService {
  private prisma = getPrismaClient();

  /**
   * Calculate NeuronScore from all dimensions (0-1000)
   */
  calculateScore(dimensions: ScoreDimensions): number {
    const total =
      dimensions.assessment +
      dimensions.clientRatings +
      dimensions.portfolioDepth +
      dimensions.workDelivery +
      dimensions.marketplace +
      dimensions.community;

    return Math.min(1000, Math.max(0, Math.round(total)));
  }

  /**
   * Determine tier from score
   */
  determineTier(score: number): string {
    if (score >= 850) return "elite";
    if (score >= 700) return "elite";
    if (score >= 550) return "professional";
    if (score >= 400) return "verified";
    return "conditional";
  }

  /**
   * Initialize NeuronScore from assessment tier
   */
  getInitialScoreFromTier(tier: string): number {
    switch (tier) {
      case "elite":
        return Math.floor(Math.random() * 151) + 700; // 700-850
      case "professional":
        return Math.floor(Math.random() * 150) + 550; // 550-699
      case "verified":
        return Math.floor(Math.random() * 150) + 400; // 400-549
      case "conditional":
        return Math.floor(Math.random() * 200) + 200; // 200-399
      default:
        return 200;
    }
  }

  /**
   * Recalculate NeuronScore for an engineer
   */
  async recalculateScore(
    engineerProfileId: string,
    reason: string,
    dimension?: string,
    triggeredBy?: string,
  ): Promise<number> {
    const profile = await this.prisma.engineerProfile.findUnique({
      where: { id: engineerProfileId },
      include: {
        assessments: {
          where: { status: "evaluated" },
          orderBy: { evaluatedAt: "desc" },
          take: 1,
        },
        projects: true,
        skills: true,
      },
    });

    if (!profile) {
      throw new Error("Engineer profile not found");
    }

    // Calculate each dimension
    const dimensions: ScoreDimensions = {
      assessment: this.calculateAssessmentScore(profile.assessments),
      clientRatings: this.calculateClientRatingsScore(profile),
      portfolioDepth: this.calculatePortfolioScore(profile),
      workDelivery: this.calculateWorkDeliveryScore(profile),
      marketplace: this.calculateMarketplaceScore(profile),
      community: this.calculateCommunityScore(profile),
    };

    // Calculate total score
    const newScore = this.calculateScore(dimensions);
    const previousScore = profile.neuronScore;
    const scoreDelta = newScore - previousScore;

    // Determine new tier
    const newTier = this.determineTier(newScore);

    // Update profile
    await this.prisma.engineerProfile.update({
      where: { id: engineerProfileId },
      data: {
        neuronScore: newScore,
        neuronTier: newTier,
        lastActivityAt: new Date(),
      },
    });

    // Log score history
    await this.prisma.neuronScoreHistory.create({
      data: {
        id: uuidv4(),
        engineerProfileId,
        previousScore,
        newScore,
        scoreDelta,
        assessment: dimensions.assessment,
        clientRatings: dimensions.clientRatings,
        portfolioDepth: dimensions.portfolioDepth,
        workDelivery: dimensions.workDelivery,
        marketplace: dimensions.marketplace,
        community: dimensions.community,
        reason,
        dimension,
        triggeredBy,
      },
    });

    return newScore;
  }

  /**
   * Calculate assessment dimension score (0-250)
   */
  private calculateAssessmentScore(assessments: any[]): number {
    if (assessments.length === 0) return 0;

    const latestAssessment = assessments[0];

    if (!latestAssessment.totalScore) return 0;

    // Convert assessment score (0-100) to dimension score (0-250)
    return Math.round((latestAssessment.totalScore / 100) * 250);
  }

  /**
   * Calculate client ratings dimension score (0-250)
   */
  private calculateClientRatingsScore(_profile: any): number {
    // TODO: Implement when client ratings are available
    // For now, return 0
    return 0;
  }

  /**
   * Calculate portfolio depth dimension score (0-200)
   */
  private calculatePortfolioScore(profile: any): number {
    const { projects, skills } = profile;

    let score = 0;

    // Projects (0-120)
    const projectCount = projects.length;
    score += Math.min(120, projectCount * 20); // 20 points per project, max 6 projects

    // Featured projects bonus
    const featuredCount = projects.filter((p: any) => p.featured).length;
    score += featuredCount * 10; // 10 bonus points per featured project

    // Skills (0-80)
    const skillCount = skills.length;
    score += Math.min(80, skillCount * 5); // 5 points per skill, max 16 skills

    // Verified skills bonus
    const verifiedCount = skills.filter((s: any) => s.verified).length;
    score += verifiedCount * 5; // 5 bonus points per verified skill

    return Math.min(200, score);
  }

  /**
   * Calculate work delivery dimension score (0-150)
   */
  private calculateWorkDeliveryScore(_profile: any): number {
    // TODO: Implement when work history is available
    // Factors: on-time delivery, quality ratings, completion rate
    return 0;
  }

  /**
   * Calculate marketplace dimension score (0-100)
   */
  private calculateMarketplaceScore(_profile: any): number {
    // TODO: Implement when marketplace activity is available
    // Factors: jobs completed, earnings, response rate
    return 0;
  }

  /**
   * Calculate community dimension score (0-50)
   */
  private calculateCommunityScore(_profile: any): number {
    // TODO: Implement when community features are available
    // Factors: forum posts, helpful answers, mentoring
    return 0;
  }

  /**
   * Apply score decay for inactivity
   * -2% per 30-day period after 90 days idle, max 15% total decay
   */
  async applyScoreDecay(engineerProfileId: string): Promise<number> {
    const profile = await this.prisma.engineerProfile.findUnique({
      where: { id: engineerProfileId },
    });

    if (!profile) {
      throw new Error("Engineer profile not found");
    }

    const daysSinceActivity = Math.floor(
      (Date.now() - profile.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    // No decay if active within 90 days
    if (daysSinceActivity < 90) {
      return profile.neuronScore;
    }

    // Calculate decay periods (30-day periods after 90 days)
    const inactiveDays = daysSinceActivity - 90;
    const decayPeriods = Math.floor(inactiveDays / 30);

    // Calculate decay percentage (2% per period, max 15%)
    const decayPercentage = Math.min(15, decayPeriods * 2);

    // Apply decay
    const decayAmount = Math.round(
      profile.neuronScore * (decayPercentage / 100),
    );
    const newScore = profile.neuronScore - decayAmount;

    if (decayAmount > 0) {
      await this.recalculateScore(
        engineerProfileId,
        `Inactivity decay: ${decayPercentage}% (${daysSinceActivity} days inactive)`,
        "inactivity_decay",
        "system",
      );
    }

    return newScore;
  }

  /**
   * Get score history for an engineer
   */
  async getScoreHistory(
    engineerProfileId: string,
    limit: number = 50,
  ): Promise<any[]> {
    return await this.prisma.neuronScoreHistory.findMany({
      where: { engineerProfileId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get score breakdown
   */
  async getScoreBreakdown(engineerProfileId: string): Promise<{
    totalScore: number;
    tier: string;
    dimensions: ScoreDimensions;
    history: any[];
  }> {
    const profile = await this.prisma.engineerProfile.findUnique({
      where: { id: engineerProfileId },
      include: {
        assessments: {
          where: { status: "evaluated" },
          orderBy: { evaluatedAt: "desc" },
          take: 1,
        },
        projects: true,
        skills: true,
      },
    });

    if (!profile) {
      throw new Error("Engineer profile not found");
    }

    const dimensions: ScoreDimensions = {
      assessment: this.calculateAssessmentScore(profile.assessments),
      clientRatings: this.calculateClientRatingsScore(profile),
      portfolioDepth: this.calculatePortfolioScore(profile),
      workDelivery: this.calculateWorkDeliveryScore(profile),
      marketplace: this.calculateMarketplaceScore(profile),
      community: this.calculateCommunityScore(profile),
    };

    const history = await this.getScoreHistory(engineerProfileId, 10);

    return {
      totalScore: profile.neuronScore,
      tier: profile.neuronTier,
      dimensions,
      history,
    };
  }
}
