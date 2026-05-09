import { PrismaClient } from '@prisma/client';

export class ProductAnalyticsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get product analytics
   */
  async getProductAnalytics(productId: string, engineerId: string, period: 'week' | 'month' | 'year' | 'all' = 'month') {
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.userId !== engineerId) {
      throw new Error('Unauthorized');
    }

    // Calculate date range
    const startDate = this.getStartDate(period);

    // Get analytics data
    const analytics = await this.prisma.productAnalytics.findMany({
      where: {
        productId,
        date: {
          gte: startDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Aggregate totals
    const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
    const totalPurchases = analytics.reduce((sum, a) => sum + a.purchases, 0);
    const totalRevenue = analytics.reduce((sum, a) => sum + Number(a.revenue), 0);
    const totalRefunds = analytics.reduce((sum, a) => sum + a.refunds, 0);

    // Calculate conversion rate
    const conversionRate = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0;

    // Get rating trend
    const reviews = await this.prisma.productReview.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const ratingTrend = this.calculateRatingTrend(reviews);

    // Get top buyer industries
    const purchases = await this.prisma.purchase.findMany({
      where: {
        productId,
        status: 'completed',
        purchasedAt: {
          gte: startDate
        }
      },
      include: {
        companyProfile: {
          select: {
            industry: true
          }
        }
      }
    });

    const topIndustries = this.calculateTopIndustries(purchases);

    // Calculate refund rate
    const refundRate = totalPurchases > 0 ? (totalRefunds / totalPurchases) * 100 : 0;

    return {
      productId,
      productName: product.name,
      period,
      summary: {
        totalViews,
        totalPurchases,
        totalRevenue,
        totalRefunds,
        conversionRate,
        refundRate,
        averageOrderValue: totalPurchases > 0 ? totalRevenue / totalPurchases : 0
      },
      ratingTrend,
      topIndustries,
      dailyData: analytics.map(a => ({
        date: a.date,
        views: a.views,
        purchases: a.purchases,
        revenue: Number(a.revenue),
        refunds: a.refunds
      }))
    };
  }

  /**
   * Get engineer dashboard analytics
   */
  async getEngineerDashboard(engineerId: string) {
    const products = await this.prisma.product.findMany({
      where: { userId: engineerId },
      include: {
        _count: {
          select: {
            purchases: true,
            reviews: true
          }
        }
      }
    });

    const productIds = products.map(p => p.id);

    // Get all purchases
    const purchases = await this.prisma.purchase.findMany({
      where: {
        productId: { in: productIds },
        status: 'completed'
      }
    });

    const totalRevenue = purchases.reduce((sum, p) => {
      const amount = p.currency === 'INR' ? p.priceINR : p.priceUSD;
      return sum + Number(amount || 0);
    }, 0);

    const totalPayout = purchases.reduce((sum, p) => {
      return sum + Number(p.engineerPayout || 0);
    }, 0);

    const totalCommission = purchases.reduce((sum, p) => {
      return sum + Number(p.platformCommission || 0);
    }, 0);

    // Get recent analytics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAnalytics = await this.prisma.productAnalytics.findMany({
      where: {
        productId: { in: productIds },
        date: {
          gte: thirtyDaysAgo
        }
      }
    });

    const recentViews = recentAnalytics.reduce((sum, a) => sum + a.views, 0);
    const recentPurchases = recentAnalytics.reduce((sum, a) => sum + a.purchases, 0);
    const recentRevenue = recentAnalytics.reduce((sum, a) => sum + Number(a.revenue), 0);

    // Top performing products
    const topProducts = products
      .map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        purchaseCount: p._count.purchases,
        reviewCount: p._count.reviews,
        rating: p.rating
      }))
      .sort((a, b) => b.purchaseCount - a.purchaseCount)
      .slice(0, 5);

    return {
      overview: {
        totalProducts: products.length,
        publishedProducts: products.filter(p => p.status === 'published').length,
        totalSales: purchases.length,
        totalRevenue,
        totalPayout,
        totalCommission
      },
      last30Days: {
        views: recentViews,
        purchases: recentPurchases,
        revenue: recentRevenue
      },
      topProducts
    };
  }

  /**
   * Get sales by period
   */
  async getSalesByPeriod(productId: string, engineerId: string, groupBy: 'day' | 'week' | 'month' = 'day') {
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.userId !== engineerId) {
      throw new Error('Unauthorized');
    }

    const purchases = await this.prisma.purchase.findMany({
      where: {
        productId,
        status: 'completed'
      },
      orderBy: {
        purchasedAt: 'asc'
      }
    });

    // Group by period
    const grouped: Record<string, { count: number; revenue: number }> = {};

    purchases.forEach(p => {
      const key = this.getPeriodKey(p.purchasedAt, groupBy);
      if (!grouped[key]) {
        grouped[key] = { count: 0, revenue: 0 };
      }
      grouped[key].count++;
      const amount = p.currency === 'INR' ? p.priceINR : p.priceUSD;
      grouped[key].revenue += Number(amount || 0);
    });

    return Object.entries(grouped).map(([period, data]) => ({
      period,
      sales: data.count,
      revenue: data.revenue
    }));
  }

  // Helper methods

  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        now.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        now.setFullYear(2020); // Beginning of platform
        break;
    }
    now.setHours(0, 0, 0, 0);
    return now;
  }

  private calculateRatingTrend(reviews: any[]): any {
    if (reviews.length === 0) {
      return { current: 0, trend: 'stable', change: 0 };
    }

    const recentReviews = reviews.slice(0, 10);
    const olderReviews = reviews.slice(10, 20);

    const recentAvg = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;
    const olderAvg = olderReviews.length > 0
      ? olderReviews.reduce((sum, r) => sum + r.rating, 0) / olderReviews.length
      : recentAvg;

    const change = recentAvg - olderAvg;
    const trend = change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'stable';

    return {
      current: recentAvg,
      trend,
      change: Math.abs(change)
    };
  }

  private calculateTopIndustries(purchases: any[]): any[] {
    const industries: Record<string, number> = {};

    purchases.forEach(p => {
      if (p.companyProfile?.industry) {
        industries[p.companyProfile.industry] = (industries[p.companyProfile.industry] || 0) + 1;
      }
    });

    return Object.entries(industries)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getPeriodKey(date: Date, groupBy: string): string {
    const d = new Date(date);
    switch (groupBy) {
      case 'day':
        return d.toISOString().substring(0, 10); // YYYY-MM-DD
      case 'week':
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toISOString().substring(0, 10);
      case 'month':
        return d.toISOString().substring(0, 7); // YYYY-MM
      default:
        return d.toISOString().substring(0, 10);
    }
  }
}
