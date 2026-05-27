import { PrismaClient, SubscriptionStatus } from "@prisma/client";
import Razorpay from "razorpay";
import { getEnv } from "../config/env";

export class SubscriptionService {
  private prisma: PrismaClient;
  private razorpay: Razorpay;

  constructor() {
    this.prisma = new PrismaClient();
    const env = getEnv();
    this.razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }

  /**
   * Create subscription for purchase
   */
  async createSubscription(
    purchaseId: string,
    billingCycle: "monthly" | "quarterly" | "yearly",
  ) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        product: true,
      },
    });

    if (!purchase) {
      throw new Error("Purchase not found");
    }

    if (purchase.product.pricingModel !== "subscription") {
      throw new Error("Product is not a subscription");
    }

    if (purchase.status !== "completed") {
      throw new Error("Purchase not completed");
    }

    // Check if subscription already exists
    const existing = await this.prisma.subscription.findUnique({
      where: { purchaseId },
    });

    if (existing) {
      throw new Error("Subscription already exists");
    }

    // Calculate next billing date
    const nextBillingDate = this.calculateNextBillingDate(billingCycle);

    // Create Razorpay subscription plan
    // TODO: Implement actual Razorpay subscription plan creation
    const razorpayPlanId = `plan_${Date.now()}`;
    const razorpaySubscriptionId = `sub_${Date.now()}`;

    // Create subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        purchaseId,
        productId: purchase.productId,
        buyerId: purchase.buyerId,
        razorpaySubscriptionId,
        razorpayPlanId,
        billingCycle,
        nextBillingDate,
        status: SubscriptionStatus.active,
      },
    });

    return subscription;
  }

  /**
   * Process subscription billing
   */
  async processBilling(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        purchase: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (subscription.status !== SubscriptionStatus.active) {
      throw new Error("Subscription is not active");
    }

    // Check if billing is due
    if (new Date() < subscription.nextBillingDate) {
      throw new Error("Billing not yet due");
    }

    try {
      // Process payment using Razorpay
      // TODO: Implement actual Razorpay subscription charge
      console.log(`Processing billing for subscription ${subscriptionId}`);

      // Calculate next billing date
      const nextBillingDate = this.calculateNextBillingDate(
        subscription.billingCycle,
      );

      // Update subscription
      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          lastBillingDate: new Date(),
          nextBillingDate,
          failedPayments: 0,
        },
      });

      return {
        success: true,
        nextBillingDate,
      };
    } catch (error) {
      console.error("Billing error:", error);

      // Increment failed payments
      const updated = await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          failedPayments: { increment: 1 },
        },
      });

      // Mark as past_due after 3 failed attempts
      if (updated.failedPayments >= 3) {
        await this.prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: SubscriptionStatus.past_due,
          },
        });
      }

      throw new Error("Billing failed");
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    userId: string,
    reason?: string,
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        purchase: true,
      },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (subscription.buyerId !== userId) {
      throw new Error("Unauthorized");
    }

    if (subscription.status === SubscriptionStatus.cancelled) {
      throw new Error("Subscription already cancelled");
    }

    // Cancel Razorpay subscription
    // TODO: Implement actual Razorpay subscription cancellation
    console.log(`Cancelling subscription ${subscriptionId}`);

    // Update subscription
    const cancelled = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.cancelled,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    // Revoke license
    await this.prisma.purchase.update({
      where: { id: subscription.purchaseId },
      data: {
        licenseActive: false,
        licenseRevokedAt: new Date(),
      },
    });

    return cancelled;
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(subscriptionId: string, userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (subscription.buyerId !== userId) {
      throw new Error("Unauthorized");
    }

    if (subscription.status !== SubscriptionStatus.cancelled) {
      throw new Error("Subscription is not cancelled");
    }

    // Reactivate Razorpay subscription
    // TODO: Implement actual Razorpay subscription reactivation
    console.log(`Reactivating subscription ${subscriptionId}`);

    // Calculate next billing date
    const nextBillingDate = this.calculateNextBillingDate(
      subscription.billingCycle,
    );

    // Update subscription
    const reactivated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.active,
        nextBillingDate,
        cancelledAt: null,
        cancellationReason: null,
        failedPayments: 0,
      },
    });

    // Reactivate license
    await this.prisma.purchase.update({
      where: { id: subscription.purchaseId },
      data: {
        licenseActive: true,
        licenseRevokedAt: null,
      },
    });

    return reactivated;
  }

  /**
   * Get buyer's subscriptions
   */
  async getBuyerSubscriptions(buyerId: string) {
    return await this.prisma.subscription.findMany({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
      include: {
        purchase: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                thumbnailUrl: true,
                category: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get engineer's subscription customers
   */
  async getEngineerSubscriptions(engineerId: string) {
    return await this.prisma.subscription.findMany({
      where: {
        purchase: {
          product: {
            userId: engineerId,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        purchase: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Process all due billings (cron job)
   */
  async processDueBillings() {
    const dueSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.active,
        nextBillingDate: {
          lte: new Date(),
        },
      },
    });

    const results = [];

    for (const subscription of dueSubscriptions) {
      try {
        const result = await this.processBilling(subscription.id);
        results.push({
          subscriptionId: subscription.id,
          ...result,
        });
      } catch (error: any) {
        results.push({
          subscriptionId: subscription.id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  // Helper methods

  private calculateNextBillingDate(billingCycle: string): Date {
    const nextDate = new Date();

    switch (billingCycle) {
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case "quarterly":
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case "yearly":
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }

    return nextDate;
  }
}
