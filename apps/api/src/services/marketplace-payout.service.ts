import { PrismaClient } from '@prisma/client';
import Razorpay from 'razorpay';
import { getEnv } from '../config/env';

export class MarketplacePayoutService {
  private prisma: PrismaClient;
  private razorpay: Razorpay;

  constructor() {
    this.prisma = new PrismaClient();
    const env = getEnv();
    this.razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET
    });
  }

  /**
   * Process payout to engineer
   */
  async processPayout(purchaseId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        product: {
          include: {
            engineerProfile: true
          }
        }
      }
    });

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    if (purchase.status !== 'completed') {
      throw new Error('Purchase not completed');
    }

    if (purchase.payoutStatus === 'completed') {
      throw new Error('Payout already processed');
    }

    if (!purchase.product.engineerProfile.upiId) {
      throw new Error('Engineer UPI ID not configured');
    }

    // Check if 48 hours have passed
    const hoursSincePurchase = (Date.now() - purchase.purchasedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSincePurchase < 48) {
      throw new Error('Payout can only be processed after 48 hours');
    }

    try {
      // Create payout using Razorpay
      const payoutId = `payout_${Date.now()}_${purchaseId}`;
      
      // TODO: Implement actual Razorpay payout API call
      // const payout = await this.razorpay.payouts.create({
      //   account_number: getEnv().RAZORPAY_ACCOUNT_NUMBER,
      //   fund_account_id: purchase.product.engineerProfile.upiId,
      //   amount: Number(purchase.engineerPayout) * 100,
      //   currency: purchase.currency,
      //   mode: 'UPI',
      //   purpose: 'payout',
      //   queue_if_low_balance: true,
      //   reference_id: purchaseId,
      //   narration: `Product sale: ${purchase.product.name}`
      // });

      console.log(`Payout initiated: ${payoutId} for ₹${purchase.engineerPayout} to ${purchase.product.engineerProfile.upiId}`);

      // Update purchase with payout info
      await this.prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          payoutStatus: 'processing',
          payoutId,
          paidOutAt: new Date()
        }
      });

      return {
        success: true,
        payoutId,
        amount: purchase.engineerPayout,
        status: 'processing'
      };
    } catch (error) {
      console.error('Payout error:', error);
      
      await this.prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          payoutStatus: 'failed'
        }
      });

      throw new Error('Failed to process payout');
    }
  }

  /**
   * Process batch payouts
   */
  async processBatchPayouts() {
    // Get all purchases eligible for payout
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

    const eligiblePurchases = await this.prisma.purchase.findMany({
      where: {
        status: 'completed',
        payoutStatus: null,
        purchasedAt: {
          lte: cutoffTime
        }
      },
      include: {
        product: {
          include: {
            engineerProfile: true
          }
        }
      }
    });

    const results = [];

    for (const purchase of eligiblePurchases) {
      try {
        const result = await this.processPayout(purchase.id);
        results.push({
          purchaseId: purchase.id,
          ...result,
          success: true
        });
      } catch (error: any) {
        results.push({
          purchaseId: purchase.id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get payout status
   */
  async getPayoutStatus(payoutId: string): Promise<string> {
    try {
      // TODO: Implement actual Razorpay payout status check
      // const payout = await this.razorpay.payouts.fetch(payoutId);
      // return payout.status;
      
      console.log(`Checking payout status: ${payoutId}`);
      return 'processing';
    } catch (error) {
      console.error('Get payout status error:', error);
      return 'unknown';
    }
  }

  /**
   * Get engineer earnings summary
   */
  async getEngineerEarnings(engineerId: string) {
    const purchases = await this.prisma.purchase.findMany({
      where: {
        product: {
          userId: engineerId
        },
        status: 'completed'
      },
      include: {
        product: {
          select: {
            name: true,
            category: true
          }
        }
      }
    });

    const totalRevenue = purchases.reduce((sum, p) => {
      const amount = p.currency === 'INR' ? p.priceINR : p.priceUSD;
      return sum + Number(amount || 0);
    }, 0);

    const totalCommission = purchases.reduce((sum, p) => {
      return sum + Number(p.platformCommission || 0);
    }, 0);

    const totalPayout = purchases.reduce((sum, p) => {
      return sum + Number(p.engineerPayout || 0);
    }, 0);

    const pendingPayout = purchases
      .filter(p => !p.payoutStatus || p.payoutStatus === 'pending')
      .reduce((sum, p) => sum + Number(p.engineerPayout || 0), 0);

    const completedPayout = purchases
      .filter(p => p.payoutStatus === 'completed')
      .reduce((sum, p) => sum + Number(p.engineerPayout || 0), 0);

    return {
      totalSales: purchases.length,
      totalRevenue,
      totalCommission,
      totalPayout,
      pendingPayout,
      completedPayout,
      averageOrderValue: purchases.length > 0 ? totalRevenue / purchases.length : 0,
      recentPurchases: purchases.slice(0, 10)
    };
  }

  /**
   * Get product earnings breakdown
   */
  async getProductEarnings(productId: string, engineerId: string) {
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
        purchasedAt: 'desc'
      }
    });

    const totalRevenue = purchases.reduce((sum, p) => {
      const amount = p.currency === 'INR' ? p.priceINR : p.priceUSD;
      return sum + Number(amount || 0);
    }, 0);

    const totalPayout = purchases.reduce((sum, p) => {
      return sum + Number(p.engineerPayout || 0);
    }, 0);

    // Group by month
    const monthlyRevenue: Record<string, number> = {};
    purchases.forEach(p => {
      const month = p.purchasedAt.toISOString().substring(0, 7); // YYYY-MM
      const amount = p.currency === 'INR' ? p.priceINR : p.priceUSD;
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(amount || 0);
    });

    return {
      productId,
      productName: product.name,
      totalSales: purchases.length,
      totalRevenue,
      totalPayout,
      monthlyRevenue,
      recentPurchases: purchases.slice(0, 20)
    };
  }
}
