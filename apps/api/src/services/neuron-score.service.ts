import { getPrismaClient } from "../config/database";
import { v4 as uuidv4 } from "uuid";

export interface ScoreDimensions {
  assessment: number; // 0-100
  clientRatings: number; // 0-100
  portfolioDepth: number; // 0-100
  workDelivery: number; // 0-100
  marketplace: number; // 0-100
  community: number; // 0-100
}

type ScoreBoostEventType =
  | "bounty_completed"
  | "five_star_review"
  | "verified_demo_added"
  | "platform_article_published"
  | "build_in_public_post"
  | "reference_verified"
  | "contract_completed"
  | "marketplace_product_live";

export class NeuronScoreService {
  private prisma = getPrismaClient();
  private readonly BOOST_POINTS: Record<string, number> = {
    bounty_completed: 50,
    five_star_review: 15,
    verified_demo_added: 20,
    platform_article_published: 10,
    build_in_public_post: 5,
    reference_verified: 50,
    contract_completed: 25,
    marketplace_product_live: 15,
  };

  /**
   * Calculate NeuronScore from all dimensions (0-1000)
   */
  calculateScore(dimensions: ScoreDimensions): number {
    const weighted =
      dimensions.assessment * 0.25 +
      dimensions.clientRatings * 0.25 +
      dimensions.portfolioDepth * 0.2 +
      dimensions.workDelivery * 0.15 +
      dimensions.marketplace * 0.1 +
      dimensions.community * 0.05;
    return Math.min(1000, Math.max(0, Math.round(weighted * 10)));
  }

  /**
   * Determine tier from score
   */
  determineTier(score: number): string {
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
        contracts: true,
        products: true,
        activities: true,
      },
    });

    if (!profile) {
      throw new Error("Engineer profile not found");
    }

    // Calculate each dimension
    const dimensions: ScoreDimensions = {
      assessment: this.calculateAssessmentScore(profile.assessments),
      clientRatings: await this.calculateClientRatingsScore(engineerProfileId),
      portfolioDepth: this.calculatePortfolioScore(profile.projects),
      workDelivery: this.calculateWorkDeliveryScore(profile.contracts),
      marketplace: this.calculateMarketplaceScore(profile.products),
      community: this.calculateCommunityScore(profile.activities),
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
  private calculateAssessmentScore(
    assessments: Array<{ overallScore: number | null }>,
  ): number {
    if (assessments.length === 0) return 0;
    return Math.max(0, Math.min(100, Math.round(assessments[0].overallScore ?? 0)));
  }

  /**
   * Calculate client ratings dimension score (0-250)
   */
  private async calculateClientRatingsScore(
    engineerProfileId: string,
  ): Promise<number> {
    const reviewed = await this.prisma.taskSubmission.findMany({
      where: {
        engineerProfileId,
        status: { in: ["accepted", "winner"] },
        score: { not: null },
      },
      select: { score: true },
      take: 50,
    });
    if (reviewed.length < 3) return 50;
    const avg = reviewed.reduce((sum, item) => sum + (item.score ?? 0), 0) / reviewed.length;
    return Math.max(0, Math.min(100, Math.round(avg)));
  }

  /**
   * Calculate portfolio depth dimension score (0-200)
   */
  private calculatePortfolioScore(
    projects: Array<{
      demoUrl: string | null;
      videoUrl?: string | null;
      performanceMetrics: unknown;
      githubUrl: string | null;
    }>,
  ): number {
    if (projects.length === 0) return 0;
    let complexity = 0;
    for (const p of projects) {
      if (p.demoUrl) complexity += 3;
      if (p.videoUrl) complexity += 2;
      if (p.performanceMetrics) complexity += 2;
      if (p.githubUrl) complexity += 1;
    }
    const maxPossible = projects.length * 8;
    return Math.max(0, Math.min(100, Math.round((complexity / Math.max(1, maxPossible)) * 100)));
  }

  /**
   * Calculate work delivery dimension score (0-150)
   */
  private calculateWorkDeliveryScore(
    contracts: Array<{ status: string; createdAt: Date; updatedAt: Date }>,
  ): number {
    if (contracts.length === 0) return 50;
    const completed = contracts.filter((c) => c.status === "completed").length;
    const disputed = contracts.filter((c) => c.status === "disputed").length;
    const completionRate = completed / contracts.length;
    const disputeRate = disputed / contracts.length;
    const onTimeRate = Math.max(0, 1 - disputeRate);
    const score = (onTimeRate * 0.5 + (1 - disputeRate) * 0.3 + completionRate * 0.2) * 100;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate marketplace dimension score (0-100)
   */
  private calculateMarketplaceScore(
    products: Array<{ purchaseCount: number; rating: unknown }>,
  ): number {
    if (products.length === 0) return 0;
    const productCount = products.length;
    const sales = products.reduce((sum, p) => sum + p.purchaseCount, 0);
    const avgRating =
      products.reduce((sum, p) => sum + Number(p.rating ?? 0), 0) /
      Math.max(1, products.length);
    const raw = productCount * Math.max(1, avgRating) * Math.log(sales + 1);
    return Math.max(0, Math.min(100, Math.round(raw * 8)));
  }

  /**
   * Calculate community dimension score (0-50)
   */
  private calculateCommunityScore(
    activities: Array<{ id: string }>,
  ): number {
    const buildInPublicPosts = activities.length;
    const score = Math.min(100, buildInPublicPosts * 5);
    return score;
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

    const decayAmount = Math.round(profile.neuronScore * (decayPercentage / 100));
    const newScore = Math.max(0, profile.neuronScore - decayAmount);
    if (decayAmount <= 0) return profile.neuronScore;

    await this.prisma.engineerProfile.update({
      where: { id: engineerProfileId },
      data: { neuronScore: newScore },
    });
    await this.prisma.neuronScoreHistory.create({
      data: {
        id: uuidv4(),
        engineerProfileId,
        previousScore: profile.neuronScore,
        newScore,
        scoreDelta: newScore - profile.neuronScore,
        reason: `Inactivity decay: ${decayPercentage}% (${daysSinceActivity} days inactive)`,
        dimension: "inactivity_decay",
        triggeredBy: "system",
      },
    });
    return newScore;
  }

  async addScoreBoostEvent(
    engineerProfileId: string,
    eventType: ScoreBoostEventType | string,
  ): Promise<number> {
    const profile = await this.prisma.engineerProfile.findUnique({
      where: { id: engineerProfileId },
    });
    if (!profile) throw new Error("Engineer profile not found");
    const boost = this.BOOST_POINTS[eventType] ?? 0;
    const newScore = Math.min(1000, profile.neuronScore + boost);
    await this.prisma.engineerProfile.update({
      where: { id: engineerProfileId },
      data: { neuronScore: newScore, neuronTier: this.determineTier(newScore) },
    });
    await this.prisma.neuronScoreHistory.create({
      data: {
        id: uuidv4(),
        engineerProfileId,
        previousScore: profile.neuronScore,
        newScore,
        scoreDelta: newScore - profile.neuronScore,
        reason: `Score boost event: ${eventType}`,
        dimension: "boost",
        triggeredBy: "system",
      },
    });
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
        contracts: true,
        products: true,
        activities: true,
      },
    });

    if (!profile) {
      throw new Error("Engineer profile not found");
    }

    const dimensions: ScoreDimensions = {
      assessment: this.calculateAssessmentScore(profile.assessments),
      clientRatings: await this.calculateClientRatingsScore(engineerProfileId),
      portfolioDepth: this.calculatePortfolioScore(profile.projects),
      workDelivery: this.calculateWorkDeliveryScore(profile.contracts),
      marketplace: this.calculateMarketplaceScore(profile.products),
      community: this.calculateCommunityScore(profile.activities),
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
