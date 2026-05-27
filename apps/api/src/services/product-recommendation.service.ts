import { PrismaClient } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "../config/env";

export class ProductRecommendationService {
  private prisma: PrismaClient;
  private anthropic: Anthropic;

  constructor() {
    this.prisma = new PrismaClient();
    const env = getEnv();
    this.anthropic = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Get AI-powered product recommendations for a company
   */
  async getRecommendations(userId: string, limit: number = 10) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        companyProfile: true,
        purchases: {
          include: {
            product: {
              select: {
                category: true,
                tags: true,
                aiModelUsed: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.companyProfile) {
      throw new Error("Company profile not found");
    }

    // Build company context
    const companyContext = {
      industry: user.companyProfile.industry,
      aiRequirements: user.companyProfile.aiRequirements,
      pastPurchases: user.purchases.map((p) => ({
        category: p.product.category,
        tags: p.product.tags,
        aiModel: p.product.aiModelUsed,
      })),
    };

    // Get all published products
    const products = await this.prisma.product.findMany({
      where: {
        status: "published",
      },
      include: {
        engineerProfile: {
          select: {
            fullName: true,
            neuronScore: true,
            neuronTier: true,
          },
        },
        _count: {
          select: {
            purchases: true,
            reviews: true,
          },
        },
      },
    });

    // Score products based on relevance
    const scoredProducts = await Promise.all(
      products.map(async (product) => {
        const relevanceScore = await this.calculateRelevanceScore(
          product,
          companyContext,
        );
        return {
          product,
          relevanceScore,
        };
      }),
    );

    // Sort by relevance score
    scoredProducts.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Return top N recommendations
    return scoredProducts.slice(0, limit).map((sp) => ({
      ...sp.product,
      relevanceScore: sp.relevanceScore,
      recommendationReason: this.generateRecommendationReason(
        sp.product,
        companyContext,
      ),
    }));
  }

  /**
   * Get similar products
   */
  async getSimilarProducts(productId: string, limit: number = 5) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Find products with similar category, tags, or AI model
    const similarProducts = await this.prisma.product.findMany({
      where: {
        id: { not: productId },
        status: "published",
        OR: [
          { category: product.category },
          { tags: { hasSome: product.tags } },
          { aiModelUsed: product.aiModelUsed },
        ],
      },
      include: {
        engineerProfile: {
          select: {
            fullName: true,
            neuronScore: true,
          },
        },
        _count: {
          select: {
            purchases: true,
            reviews: true,
          },
        },
      },
      take: limit * 2, // Get more to filter
    });

    // Calculate similarity scores
    const scoredProducts = similarProducts.map((p) => ({
      product: p,
      similarityScore: this.calculateSimilarityScore(product, p),
    }));

    // Sort by similarity
    scoredProducts.sort((a, b) => b.similarityScore - a.similarityScore);

    return scoredProducts.slice(0, limit).map((sp) => sp.product);
  }

  /**
   * Get trending products
   */
  async getTrendingProducts(limit: number = 10) {
    // Get products with most purchases in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const products = await this.prisma.product.findMany({
      where: {
        status: "published",
        publishedAt: {
          lte: thirtyDaysAgo,
        },
      },
      include: {
        engineerProfile: {
          select: {
            fullName: true,
            neuronScore: true,
          },
        },
        purchases: {
          where: {
            purchasedAt: {
              gte: thirtyDaysAgo,
            },
            status: "completed",
          },
        },
        _count: {
          select: {
            purchases: true,
            reviews: true,
          },
        },
      },
    });

    // Calculate trending score
    const scoredProducts = products.map((p) => {
      const recentPurchases = p.purchases.length;
      const totalPurchases = p._count.purchases;
      const rating = Number(p.rating || 0);

      // Trending score: weighted by recent activity and rating
      const trendingScore =
        recentPurchases * 2 + totalPurchases * 0.5 + rating * 10;

      return {
        product: p,
        trendingScore,
        recentPurchases,
      };
    });

    // Sort by trending score
    scoredProducts.sort((a, b) => b.trendingScore - a.trendingScore);

    return scoredProducts.slice(0, limit).map((sp) => ({
      ...sp.product,
      trendingScore: sp.trendingScore,
      recentPurchases: sp.recentPurchases,
    }));
  }

  /**
   * Get products by engineer NeuronScore
   */
  async getProductsByNeuronScore(minScore: number = 700, limit: number = 20) {
    return await this.prisma.product.findMany({
      where: {
        status: "published",
        engineerProfile: {
          neuronScore: {
            gte: minScore,
          },
        },
      },
      include: {
        engineerProfile: {
          select: {
            fullName: true,
            neuronScore: true,
            neuronTier: true,
          },
        },
        _count: {
          select: {
            purchases: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        engineerProfile: {
          neuronScore: "desc",
        },
      },
      take: limit,
    });
  }

  // Helper methods

  private async calculateRelevanceScore(
    product: any,
    companyContext: any,
  ): Promise<number> {
    let score = 0;

    // Industry match
    if (product.tags.includes(companyContext.industry)) {
      score += 30;
    }

    // AI requirements match
    const matchingRequirements = companyContext.aiRequirements.filter(
      (req: string) =>
        product.tags.includes(req) ||
        product.description.toLowerCase().includes(req.toLowerCase()),
    );
    score += matchingRequirements.length * 15;

    // Past purchase patterns
    const pastCategories = companyContext.pastPurchases.map(
      (p: any) => p.category,
    );
    if (pastCategories.includes(product.category)) {
      score += 20;
    }

    // Product quality indicators
    if (product.rating) {
      score += Number(product.rating) * 2;
    }

    if (product.engineerProfile.neuronScore >= 700) {
      score += 10;
    }

    // Popularity
    if (product._count.purchases > 10) {
      score += 5;
    }

    return score;
  }

  private calculateSimilarityScore(product1: any, product2: any): number {
    let score = 0;

    // Category match
    if (product1.category === product2.category) {
      score += 40;
    }

    // Tag overlap
    const commonTags = product1.tags.filter((tag: string) =>
      product2.tags.includes(tag),
    );
    score += commonTags.length * 10;

    // AI model match
    if (product1.aiModelUsed && product1.aiModelUsed === product2.aiModelUsed) {
      score += 20;
    }

    // Price similarity (within 20%)
    const price1 = Number(product1.priceINR || 0);
    const price2 = Number(product2.priceINR || 0);
    if (price1 > 0 && price2 > 0) {
      const priceDiff = Math.abs(price1 - price2) / price1;
      if (priceDiff < 0.2) {
        score += 10;
      }
    }

    return score;
  }

  private generateRecommendationReason(
    product: any,
    companyContext: any,
  ): string {
    const reasons: string[] = [];

    if (product.tags.includes(companyContext.industry)) {
      reasons.push(`Matches your industry: ${companyContext.industry}`);
    }

    const matchingRequirements = companyContext.aiRequirements.filter(
      (req: string) => product.tags.includes(req),
    );
    if (matchingRequirements.length > 0) {
      reasons.push(
        `Addresses your AI needs: ${matchingRequirements.join(", ")}`,
      );
    }

    if (product.engineerProfile.neuronScore >= 700) {
      reasons.push(`Built by ${product.engineerProfile.neuronTier} engineer`);
    }

    if (product._count.purchases > 10) {
      reasons.push(
        `Popular choice with ${product._count.purchases}+ purchases`,
      );
    }

    if (product.rating && Number(product.rating) >= 4.5) {
      reasons.push(`Highly rated (${product.rating}/5)`);
    }

    return reasons.length > 0 ? reasons.join(" • ") : "Recommended for you";
  }
}
