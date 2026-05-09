import { PrismaClient } from '@prisma/client';
import { CreateReviewInput } from '@neuronhire/shared';

export class ProductReviewService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create product review
   */
  async createReview(userId: string, data: CreateReviewInput) {
    // Verify purchase
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: data.purchaseId },
      include: {
        product: true
      }
    });

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    if (purchase.buyerId !== userId) {
      throw new Error('Unauthorized');
    }

    if (purchase.status !== 'completed') {
      throw new Error('Can only review completed purchases');
    }

    // Check if review already exists
    const existing = await this.prisma.productReview.findUnique({
      where: { purchaseId: data.purchaseId }
    });

    if (existing) {
      throw new Error('Review already exists for this purchase');
    }

    // Create review
    const review = await this.prisma.productReview.create({
      data: {
        productId: purchase.productId,
        purchaseId: data.purchaseId,
        buyerId: userId,
        rating: data.rating,
        title: data.title,
        review: data.review,
        pros: data.pros || [],
        cons: data.cons || [],
        verified: true
      }
    });

    // Update product rating
    await this.updateProductRating(purchase.productId);

    return review;
  }

  /**
   * Update product rating
   */
  private async updateProductRating(productId: string) {
    const reviews = await this.prisma.productReview.findMany({
      where: { productId }
    });

    if (reviews.length === 0) {
      return;
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        rating: averageRating,
        reviewCount: reviews.length
      }
    });
  }

  /**
   * Get product reviews
   */
  async getProductReviews(productId: string, filters?: {
    rating?: number;
    sortBy?: 'recent' | 'helpful' | 'rating';
    cursor?: string;
    limit?: number;
  }) {
    const where: any = { productId };

    if (filters?.rating) {
      where.rating = filters.rating;
    }

    const orderBy: any = {};
    switch (filters?.sortBy) {
      case 'helpful':
        orderBy.helpfulCount = 'desc';
        break;
      case 'rating':
        orderBy.rating = 'desc';
        break;
      case 'recent':
      default:
        orderBy.createdAt = 'desc';
    }

    const limit = filters?.limit || 20;
    const cursorCondition = filters?.cursor ? { id: filters.cursor } : undefined;

    const reviews = await this.prisma.productReview.findMany({
      where,
      take: limit + 1,
      skip: filters?.cursor ? 1 : 0,
      cursor: cursorCondition,
      orderBy,
      include: {
        product: {
          select: {
            name: true
          }
        }
      }
    });

    const hasMore = reviews.length > limit;
    const items = hasMore ? reviews.slice(0, -1) : reviews;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasMore
    };
  }

  /**
   * Get review by ID
   */
  async getReview(reviewId: string) {
    const review = await this.prisma.productReview.findUnique({
      where: { id: reviewId },
      include: {
        product: {
          select: {
            name: true,
            thumbnailUrl: true
          }
        }
      }
    });

    if (!review) {
      throw new Error('Review not found');
    }

    return review;
  }

  /**
   * Mark review as helpful
   */
  async markHelpful(reviewId: string, _userId: string) {
    const review = await this.prisma.productReview.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      throw new Error('Review not found');
    }

    // TODO: Track which users marked as helpful to prevent duplicates
    // For now, just increment

    return await this.prisma.productReview.update({
      where: { id: reviewId },
      data: {
        helpfulCount: { increment: 1 }
      }
    });
  }

  /**
   * Get buyer's reviews
   */
  async getBuyerReviews(buyerId: string) {
    return await this.prisma.productReview.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            name: true,
            slug: true,
            thumbnailUrl: true
          }
        }
      }
    });
  }

  /**
   * Get product rating summary
   */
  async getRatingSummary(productId: string) {
    const reviews = await this.prisma.productReview.findMany({
      where: { productId }
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0
        }
      };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    return {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution
    };
  }
}
