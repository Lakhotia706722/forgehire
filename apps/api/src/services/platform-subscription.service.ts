import { PrismaClient, SubscriptionTier } from '@prisma/client';
import Razorpay from 'razorpay';
import { getEnv } from '../config/env';
import { FeeEngineService } from './fee-engine.service';

export class PlatformSubscriptionService {
  private prisma: PrismaClient;
  private razorpay: Razorpay;
  private feeEngine: FeeEngineService;

  // Subscription pricing (in INR)
  private pricing = {
    engineer_basic: { monthly: 0, quarterly: 0, annual: 0 }, // Free
    engineer_pro: { monthly: 499, quarterly: 1399, annual: 4999 },
    engineer_premium: { monthly: 1499, quarterly: 3999, annual: 14999 },
    company_starter: { monthly: 2999, quarterly: 7999, annual: 29999 },
    company_growth: { monthly: 5999, quarterly: 15999, annual: 59999 },
    company_enterprise: { monthly: 9999, quarterly: 26999, annual: 99999 }
  };

  constructor() {
    this.prisma = new PrismaClient();
    this.razorpay = new Razorpay({
      key_id: getEnv('RAZORPAY_KEY_ID'),
      key_secret: getEnv('RAZORPAY_KEY_SECRET')
    });
    this.feeEngine = new FeeEngineService();
  }

  /**
   * Create platform subscription
   * Engineer Pro: ₹499-₹1,499/month
   * Company: ₹2,999-₹9,999/month
   */
  async createSubscription(data: {
    userId: string;
    tier: SubscriptionTier;
    billingCycle: 'monthly' | 'quarterly' | 'annual';
  }) {
    // Check if user already has active subscription
    const existing = await this.prisma.platformSubscription.findFirst({
      where: {
        userId: data.userId,
        status: 'active'
      }
    });

    if (existing) {
      throw new Error('User already has an active subscription');
    }

    // Get pricing
    const amount = this.pricing[data.tier][data.billingCycle];

    if (amount === undefined) {
      throw new Error('Invalid tier or billing cycle');
    }

    // Calculate billing period
    const currentPeriodStart = new Date();
    const currentPeriodEnd = this.calculatePeriodEnd(data.billingCycle);
    const nextBillingDate = currentPeriodEnd;

    // Create Razorpay subscription plan
    let razorpayPlanId: string | undefined;
    let razorpaySubscriptionId: string | undefined;

    if (amount > 0) {
      const plan = await this.createRazorpayPlan(data.tier, data.billingCycle, amount);
      razorpayPlanId = plan.id;

      // Create Razorpay subscription
      const subscription = await this.createRazorpaySubscription(data.userId, razorpayPlanId);
      razorpaySubscriptionId = subscription.id;
    }

    // Create subscription record
    const platformSubscription = await this.prisma.platformSubscription.create({
      data: {
        userId: data.userId,
        tier: data.tier,
        amount,
        currency: 'INR',
        billingCycle: data.billingCycle,
        razorpaySubscriptionId,
        razorpayPlanId,
        status: 'active',
        currentPeriodStart,
        currentPeriodEnd,
        nextBillingDate
      }
    });

    // Update user role based on tier
    await this.updateUserRole(data.userId, data.tier);

    return platformSubscription;
  }

  /**
   * Create Razorpay subscription plan
   */
  private async createRazorpayPlan(
    tier: SubscriptionTier,
    billingCycle: string,
    amount: number
  ) {
    const period = billingCycle === 'monthly' ? 'monthly' : 
                   billingCycle === 'quarterly' ? 'monthly' : 'yearly';
    const interval = billingCycle === 'quarterly' ? 3 : 1;

    return await this.razorpay.plans.create({
      period,
      interval,
      item: {
        name: `NeuronHire ${tier} - ${billingCycle}`,
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        description: `${tier} subscription - ${billingCycle} billing`
      }
    });
  }

  /**
   * Create Razorpay subscription
   */
  private async createRazorpaySubscription(userId: string, planId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return await this.razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      quantity: 1,
      total_count: 0, // Infinite billing
      notes: {
        userId: user.id,
        email: user.email
      }
    });
  }

  /**
   * Process subscription billing (webhook handler)
   */
  async processBilling(razorpaySubscriptionId: string) {
    const subscription = await this.prisma.platformSubscription.findFirst({
      where: { razorpaySubscriptionId }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Calculate next billing period
    const currentPeriodStart = subscription.currentPeriodEnd;
    const currentPeriodEnd = this.calculatePeriodEnd(
      subscription.billingCycle,
      currentPeriodStart
    );
    const nextBillingDate = currentPeriodEnd;

    // Update subscription
    await this.prisma.platformSubscription.update({
      where: { id: subscription.id },
      data: {
        currentPeriodStart,
        currentPeriodEnd,
        nextBillingDate
      }
    });

    // Create payment record
    const feeCalc = this.feeEngine.calculateSubscriptionFee(
      parseFloat(subscription.amount.toString())
    );

    await this.prisma.payment.create({
      data: {
        userId: subscription.userId,
        type: 'subscription',
        status: 'completed',
        amount: subscription.amount,
        currency: subscription.currency,
        platformFee: 0,
        gstAmount: feeCalc.gstAmount,
        netAmount: feeCalc.subtotal,
        description: `${subscription.tier} subscription - ${subscription.billingCycle}`,
        completedAt: new Date(),
        idempotencyKey: `sub_${razorpaySubscriptionId}_${Date.now()}`
      }
    });

    return { success: true, nextBillingDate };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(data: {
    userId: string;
    reason?: string;
    cancelAtPeriodEnd?: boolean;
  }) {
    const subscription = await this.prisma.platformSubscription.findFirst({
      where: {
        userId: data.userId,
        status: 'active'
      }
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Cancel Razorpay subscription
    if (subscription.razorpaySubscriptionId) {
      await this.razorpay.subscriptions.cancel(
        subscription.razorpaySubscriptionId,
        data.cancelAtPeriodEnd || false
      );
    }

    // Update subscription
    const updateData: any = {
      cancellationReason: data.reason,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd || false
    };

    if (!data.cancelAtPeriodEnd) {
      updateData.status = 'cancelled';
      updateData.cancelledAt = new Date();
    }

    await this.prisma.platformSubscription.update({
      where: { id: subscription.id },
      data: updateData
    });

    // Downgrade user to basic tier if cancelled immediately
    if (!data.cancelAtPeriodEnd) {
      await this.downgradeUser(data.userId);
    }

    return { success: true, cancelAtPeriodEnd: data.cancelAtPeriodEnd };
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(data: {
    userId: string;
    newTier: SubscriptionTier;
  }) {
    const subscription = await this.prisma.platformSubscription.findFirst({
      where: {
        userId: data.userId,
        status: 'active'
      }
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Get new pricing
    const tierPricing = this.pricing[data.newTier] as Record<string, number>;
    const newAmount = tierPricing[subscription.billingCycle];

    if (newAmount === undefined) {
      throw new Error('Invalid tier');
    }

    // Calculate prorated amount
    const daysRemaining = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - new Date().getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    const totalDays = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    const proratedAmount = ((newAmount - parseFloat(subscription.amount.toString())) * daysRemaining) / totalDays;

    // Create new Razorpay plan
    const plan = await this.createRazorpayPlan(data.newTier, subscription.billingCycle, newAmount);

    // Update Razorpay subscription
    if (subscription.razorpaySubscriptionId) {
      await this.razorpay.subscriptions.update(subscription.razorpaySubscriptionId, {
        plan_id: plan.id,
        quantity: 1
      });
    }

    // Update subscription
    await this.prisma.platformSubscription.update({
      where: { id: subscription.id },
      data: {
        tier: data.newTier,
        amount: newAmount,
        razorpayPlanId: plan.id
      }
    });

    // Update user role
    await this.updateUserRole(data.userId, data.newTier);

    return { 
      success: true, 
      proratedAmount,
      newAmount 
    };
  }

  /**
   * Get user's subscription
   */
  async getUserSubscription(userId: string) {
    const subscription = await this.prisma.platformSubscription.findFirst({
      where: {
        userId,
        status: {
          in: ['active', 'past_due']
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription) {
      return {
        tier: SubscriptionTier.engineer_basic,
        status: 'none',
        features: this.getFeatures(SubscriptionTier.engineer_basic)
      };
    }

    return {
      ...subscription,
      features: this.getFeatures(subscription.tier)
    };
  }

  /**
   * Get subscription features
   */
  private getFeatures(tier: SubscriptionTier): string[] {
    const features: Record<SubscriptionTier, string[]> = {
      engineer_basic: [
        'Basic profile',
        'Apply to jobs',
        'Submit to bounties',
        'Standard support'
      ],
      engineer_pro: [
        'All Basic features',
        'Advanced analytics',
        'Priority matching',
        'Profile boost',
        'Priority support',
        'Unlimited proposals'
      ],
      engineer_premium: [
        'All Pro features',
        'Featured profile',
        'Direct company outreach',
        'Dedicated account manager',
        'Custom portfolio showcase',
        'Early access to jobs'
      ],
      company_starter: [
        'Post up to 5 jobs/month',
        'Basic talent search',
        'Standard support',
        'Basic analytics'
      ],
      company_growth: [
        'Unlimited job posts',
        'Advanced talent search API',
        'Priority support',
        'Advanced analytics',
        'Team collaboration tools',
        'Custom branding'
      ],
      company_enterprise: [
        'All Growth features',
        'Dedicated account manager',
        'Custom integrations',
        'White-label options',
        'SLA guarantee',
        'Custom contracts',
        'Volume discounts'
      ]
    };

    return features[tier] || [];
  }

  /**
   * Check if user has feature access
   */
  async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    return subscription.features.includes(feature);
  }

  /**
   * Update user role based on subscription tier
   */
  private async updateUserRole(userId: string, tier: SubscriptionTier) {
    // This is a placeholder - implement based on your user role system
    // For now, we'll just log it
    console.log(`User ${userId} upgraded to ${tier}`);
  }

  /**
   * Downgrade user to basic tier
   */
  private async downgradeUser(userId: string) {
    console.log(`User ${userId} downgraded to basic tier`);
  }

  /**
   * Calculate period end date
   */
  private calculatePeriodEnd(billingCycle: string, startDate?: Date): Date {
    const start = startDate || new Date();
    const end = new Date(start);

    switch (billingCycle) {
      case 'monthly':
        end.setMonth(end.getMonth() + 1);
        break;
      case 'quarterly':
        end.setMonth(end.getMonth() + 3);
        break;
      case 'annual':
        end.setFullYear(end.getFullYear() + 1);
        break;
    }

    return end;
  }

  /**
   * Get subscription pricing
   */
  getPricing() {
    return this.pricing;
  }

  /**
   * Handle subscription payment failure
   */
  async handlePaymentFailure(razorpaySubscriptionId: string) {
    const subscription = await this.prisma.platformSubscription.findFirst({
      where: { razorpaySubscriptionId }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    await this.prisma.platformSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'past_due'
      }
    });

    return { success: true };
  }

  /**
   * Reactivate past due subscription
   */
  async reactivateSubscription(userId: string) {
    const subscription = await this.prisma.platformSubscription.findFirst({
      where: {
        userId,
        status: 'past_due'
      }
    });

    if (!subscription) {
      throw new Error('No past due subscription found');
    }

    await this.prisma.platformSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active'
      }
    });

    return { success: true };
  }
}
