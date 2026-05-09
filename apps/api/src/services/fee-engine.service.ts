import { PrismaClient } from '@prisma/client';

export interface FeeCalculation {
  subtotal: number;
  platformFee: number;
  gstAmount: number;
  total: number;
  netToEngineer?: number;
}

export class FeeEngineService {
  private prisma: PrismaClient;
  private gstRate = 0.18; // 18% GST

  // Fee percentages
  private fees = {
    bounty: 0.10, // 10% on top (company pays)
    task: 0.10, // 10% on top (company pays)
    hourly: 0.10, // 10% deducted (engineer receives less)
    project: 0.10, // 10% deducted (engineer receives less)
    marketplace_low: 0.15, // 15% for products <₹10K
    marketplace_high: 0.20, // 20% for subscriptions/high-value
    marketplace_threshold: 10000, // ₹10K threshold
    fulltime_low: 0.08, // 8% for CTC <₹10L
    fulltime_high: 0.12, // 12% for CTC ≥₹10L
    fulltime_threshold: 1000000 // ₹10L threshold
  };

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Calculate fees for bounty/task (company pays on top)
   */
  calculateBountyFee(rewardAmount: number): FeeCalculation {
    const platformFee = rewardAmount * this.fees.bounty;
    const subtotal = rewardAmount + platformFee;
    const gstAmount = platformFee * this.gstRate;
    const total = subtotal + gstAmount;

    return {
      subtotal,
      platformFee,
      gstAmount,
      total,
      netToEngineer: rewardAmount
    };
  }

  /**
   * Calculate fees for hourly contract (deducted from engineer)
   */
  calculateHourlyFee(billingAmount: number): FeeCalculation {
    const platformFee = billingAmount * this.fees.hourly;
    const gstAmount = platformFee * this.gstRate;
    const netToEngineer = billingAmount - platformFee - gstAmount;

    return {
      subtotal: billingAmount,
      platformFee,
      gstAmount,
      total: billingAmount,
      netToEngineer
    };
  }

  /**
   * Calculate fees for project contract (deducted from engineer)
   */
  calculateProjectFee(projectAmount: number): FeeCalculation {
    const platformFee = projectAmount * this.fees.project;
    const gstAmount = platformFee * this.gstRate;
    const netToEngineer = projectAmount - platformFee - gstAmount;

    return {
      subtotal: projectAmount,
      platformFee,
      gstAmount,
      total: projectAmount,
      netToEngineer
    };
  }

  /**
   * Calculate fees for marketplace product
   */
  calculateMarketplaceFee(productPrice: number, isSubscription: boolean = false): FeeCalculation {
    let feePercentage: number;

    if (isSubscription) {
      feePercentage = this.fees.marketplace_high;
    } else if (productPrice < this.fees.marketplace_threshold) {
      feePercentage = this.fees.marketplace_low;
    } else {
      feePercentage = this.fees.marketplace_high;
    }

    const platformFee = productPrice * feePercentage;
    const gstAmount = platformFee * this.gstRate;
    const netToEngineer = productPrice - platformFee - gstAmount;

    return {
      subtotal: productPrice,
      platformFee,
      gstAmount,
      total: productPrice,
      netToEngineer
    };
  }

  /**
   * Calculate fees for full-time placement
   */
  calculateFullTimeFee(ctc: number): FeeCalculation {
    const feePercentage = ctc < this.fees.fulltime_threshold
      ? this.fees.fulltime_low
      : this.fees.fulltime_high;

    const platformFee = ctc * feePercentage;
    const gstAmount = platformFee * this.gstRate;
    const total = platformFee + gstAmount;

    return {
      subtotal: platformFee,
      platformFee,
      gstAmount,
      total,
      netToEngineer: 0 // Not applicable for full-time
    };
  }

  /**
   * Calculate subscription fee (no additional platform fee, just GST)
   */
  calculateSubscriptionFee(subscriptionAmount: number): FeeCalculation {
    const gstAmount = subscriptionAmount * this.gstRate;
    const total = subscriptionAmount + gstAmount;

    return {
      subtotal: subscriptionAmount,
      platformFee: 0,
      gstAmount,
      total
    };
  }

  /**
   * Store fee calculation in payment record
   */
  async recordFeeCalculation(data: {
    paymentId: string;
    feeCalculation: FeeCalculation;
  }) {
    return await this.prisma.payment.update({
      where: { id: data.paymentId },
      data: {
        platformFee: data.feeCalculation.platformFee,
        gstAmount: data.feeCalculation.gstAmount,
        netAmount: data.feeCalculation.netToEngineer
      }
    });
  }

  /**
   * Get fee breakdown for display
   */
  getFeeBreakdown(type: string, amount: number, metadata?: any): FeeCalculation {
    switch (type) {
      case 'bounty':
      case 'task':
        return this.calculateBountyFee(amount);
      
      case 'hourly':
        return this.calculateHourlyFee(amount);
      
      case 'project':
        return this.calculateProjectFee(amount);
      
      case 'marketplace':
        return this.calculateMarketplaceFee(
          amount,
          metadata?.isSubscription || false
        );
      
      case 'fulltime':
        return this.calculateFullTimeFee(amount);
      
      case 'subscription':
        return this.calculateSubscriptionFee(amount);
      
      default:
        throw new Error(`Unknown fee type: ${type}`);
    }
  }

  /**
   * Calculate total platform revenue from payment
   */
  calculatePlatformRevenue(feeCalculation: FeeCalculation): number {
    return feeCalculation.platformFee;
  }

  /**
   * Get fee rates for display
   */
  getFeeRates() {
    return {
      bounty: `${this.fees.bounty * 100}% (company pays on top)`,
      task: `${this.fees.task * 100}% (company pays on top)`,
      hourly: `${this.fees.hourly * 100}% (deducted from engineer)`,
      project: `${this.fees.project * 100}% (deducted from engineer)`,
      marketplace_low: `${this.fees.marketplace_low * 100}% (products <₹${this.fees.marketplace_threshold})`,
      marketplace_high: `${this.fees.marketplace_high * 100}% (subscriptions/high-value)`,
      fulltime_low: `${this.fees.fulltime_low * 100}% (CTC <₹${this.fees.fulltime_threshold})`,
      fulltime_high: `${this.fees.fulltime_high * 100}% (CTC ≥₹${this.fees.fulltime_threshold})`,
      gst: `${this.gstRate * 100}%`
    };
  }

  /**
   * Validate fee calculation
   */
  validateFeeCalculation(feeCalc: FeeCalculation): boolean {
    const calculatedTotal = feeCalc.subtotal + feeCalc.gstAmount;
    return Math.abs(calculatedTotal - feeCalc.total) < 0.01; // Allow 1 paisa difference for rounding
  }
}
