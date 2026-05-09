import { PrismaClient, PurchaseStatus } from '@prisma/client';
import Razorpay from 'razorpay';
import { getEnv } from '../config/env';
import { randomBytes } from 'crypto';
import { PurchaseProductInput } from '@neuronhire/shared';

export class MarketplacePurchaseService {
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
   * Create purchase order
   */
  async createPurchaseOrder(userId: string, data: PurchaseProductInput) {
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
      include: { engineerProfile: true }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.status !== 'published') {
      throw new Error('Product is not available for purchase');
    }

    if (product.userId === userId) {
      throw new Error('Cannot purchase your own product');
    }

    // Check if already purchased
    const existing = await this.prisma.purchase.findFirst({
      where: {
        productId: data.productId,
        buyerId: userId,
        status: PurchaseStatus.completed
      }
    });

    if (existing) {
      throw new Error('Product already purchased');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { companyProfile: true }
    });

    // Determine price based on currency
    const amount = data.currency === 'USD' && product.priceUSD
      ? product.priceUSD
      : product.priceINR;

    if (!amount) {
      throw new Error('Product price not set');
    }

    // Create Razorpay order
    const order = await this.razorpay.orders.create({
      amount: Number(amount) * 100, // Convert to paise
      currency: data.currency,
      receipt: `product_${product.id}_${Date.now()}`,
      notes: {
        productId: product.id,
        buyerId: userId,
        referralCode: data.referralCode || ''
      }
    });

    // Generate license key
    const licenseKey = this.generateLicenseKey();

    // Calculate dispute deadline (30 days)
    const disputeDeadline = new Date();
    disputeDeadline.setDate(disputeDeadline.getDate() + 30);

    // Create purchase record
    const purchase = await this.prisma.purchase.create({
      data: {
        productId: product.id,
        buyerId: userId,
        companyProfileId: user?.companyProfile?.id,
        priceINR: data.currency === 'INR' ? amount : product.priceINR ?? amount,
        priceUSD: data.currency === 'USD' ? amount : undefined,
        currency: data.currency,
        razorpayOrderId: (order as any).id,
        licenseKey,
        status: PurchaseStatus.pending,
        referralCode: data.referralCode,
        disputeDeadline
      }
    });

    return {
      purchaseId: purchase.id,
      orderId: order.id,
      amount: Number(amount),
      currency: data.currency,
      licenseKey
    };
  }

  /**
   * Complete purchase after payment
   */
  async completePurchase(purchaseId: string, data: {
    paymentId: string;
    signature: string;
  }) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        product: {
          include: { engineerProfile: true }
        }
      }
    });

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    if (purchase.status !== PurchaseStatus.pending) {
      throw new Error('Purchase already processed');
    }

    // Verify payment signature
    const isValid = this.verifyPaymentSignature(
      purchase.razorpayOrderId!,
      data.paymentId,
      data.signature
    );

    if (!isValid) {
      await this.prisma.purchase.update({
        where: { id: purchaseId },
        data: { status: PurchaseStatus.failed }
      });
      throw new Error('Payment verification failed');
    }

    // Calculate platform commission
    const amount = purchase.currency === 'INR' ? purchase.priceINR : purchase.priceUSD;
    const commission = this.calculateCommission(
      Number(amount),
      purchase.product.pricingModel
    );
    const engineerPayout = Number(amount) - commission;

    // Calculate referral commission if applicable
    let referralCommission = 0;
    if (purchase.referralCode) {
      referralCommission = Number(amount) * 0.05; // 5% referral commission
    }

    // Grant access
    const accessDetails = await this.grantAccess(purchase.product);

    // Update purchase
    const completed = await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: PurchaseStatus.completed,
        razorpayPaymentId: data.paymentId,
        razorpaySignature: data.signature,
        accessGranted: true,
        accessDetails,
        platformCommission: commission,
        engineerPayout,
        referralCommission: referralCommission > 0 ? referralCommission : null,
        purchasedAt: new Date()
      }
    });

    // Update product stats
    await this.prisma.product.update({
      where: { id: purchase.productId },
      data: {
        purchaseCount: { increment: 1 }
      }
    });

    // Track analytics
    await this.trackPurchase(purchase.productId, Number(amount));

    // Update referral stats if applicable
    if (purchase.referralCode) {
      await this.updateReferralStats(purchase.referralCode, referralCommission);
    }

    // Initiate payout to engineer (48 hours delay)
    await this.schedulePayout(purchaseId);

    return completed;
  }

  /**
   * Grant access to product
   */
  private async grantAccess(product: any): Promise<any> {
    // Generate access details based on product type
    const accessDetails: any = {
      licenseType: product.pricingModel,
      grantedAt: new Date(),
      expiresAt: product.pricingModel === 'subscription' ? this.getSubscriptionExpiry() : null
    };

    // Add download links, API keys, or other access credentials
    // This would be customized based on product delivery type
    if (product.deliveryType === 'instant') {
      accessDetails.downloadUrl = `https://neuronhire.s3.amazonaws.com/products/${product.id}/download`;
      accessDetails.accessInstructions = 'Download link is valid for 30 days';
    }

    return accessDetails;
  }

  /**
   * Calculate platform commission
   */
  private calculateCommission(amount: number, pricingModel: string): number {
    if (pricingModel === 'subscription') {
      return amount * 0.20; // 20% for subscriptions
    }

    if (amount < 10000) {
      return amount * 0.15; // 15% for products < ₹10K
    }

    return amount * 0.20; // 20% for high-value products
  }

  /**
   * Verify Razorpay payment signature
   */
  private verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const env = getEnv();

      const generatedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      return generatedSignature === signature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Generate unique license key
   */
  private generateLicenseKey(): string {
    const prefix = 'NH';
    const random = randomBytes(16).toString('hex').toUpperCase();
    return `${prefix}-${random.substring(0, 4)}-${random.substring(4, 8)}-${random.substring(8, 12)}-${random.substring(12, 16)}`;
  }

  /**
   * Schedule payout to engineer (48 hours delay)
   */
  private async schedulePayout(purchaseId: string) {
    // TODO: Implement BullMQ job to process payout after 48 hours
    console.log(`Payout scheduled for purchase ${purchaseId} in 48 hours`);
  }

  /**
   * Track purchase analytics
   */
  private async trackPurchase(productId: string, amount: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.productAnalytics.upsert({
      where: {
        productId_date: {
          productId,
          date: today
        }
      },
      create: {
        productId,
        date: today,
        purchases: 1,
        revenue: amount
      },
      update: {
        purchases: { increment: 1 },
        revenue: { increment: amount }
      }
    });
  }

  /**
   * Update referral link stats
   */
  private async updateReferralStats(referralCode: string, commission: number) {
    await this.prisma.referralLink.updateMany({
      where: { referralCode },
      data: {
        purchaseCount: { increment: 1 },
        totalCommission: { increment: commission }
      }
    });
  }

  /**
   * Get subscription expiry date
   */
  private getSubscriptionExpiry(): Date {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1); // 1 month subscription
    return expiry;
  }

  /**
   * Revoke license
   */
  async revokeLicense(purchaseId: string, engineerId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { product: true }
    });

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    if (purchase.product.userId !== engineerId) {
      throw new Error('Unauthorized');
    }

    return await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        licenseActive: false,
        licenseRevokedAt: new Date()
      }
    });
  }

  /**
   * Get buyer's purchases
   */
  async getBuyerPurchases(buyerId: string) {
    return await this.prisma.purchase.findMany({
      where: { buyerId },
      orderBy: { purchasedAt: 'desc' },
      include: {
        product: {
          select: {
            name: true,
            slug: true,
            thumbnailUrl: true,
            category: true,
            currentVersion: true
          }
        }
      }
    });
  }

  /**
   * Get purchase by ID
   */
  async getPurchase(purchaseId: string, userId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        product: {
          include: {
            engineerProfile: {
              select: {
                fullName: true
              }
            }
          }
        }
      }
    });

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    if (purchase.buyerId !== userId && purchase.product.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return purchase;
  }
}
