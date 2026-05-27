import { PrismaClient, PayoutMethod } from "@prisma/client";
import Razorpay from "razorpay";
import { getEnv } from "../config/env";

export class PayoutService {
  private prisma: PrismaClient;
  private razorpay: Razorpay;
  private minimumPayout = 500; // ₹500 minimum
  private kycThreshold = 50000; // ₹50,000/month threshold

  constructor() {
    this.prisma = new PrismaClient();
    this.razorpay = new Razorpay({
      key_id: getEnv("RAZORPAY_KEY_ID"),
      key_secret: getEnv("RAZORPAY_KEY_SECRET"),
    });
  }

  /**
   * Request payout from wallet
   * Minimum ₹500, KYC required for >₹50K/month
   */
  async requestPayout(data: {
    userId: string;
    engineerProfileId: string;
    amount: number;
    method: PayoutMethod;
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
  }) {
    // Validate minimum amount
    if (data.amount < this.minimumPayout) {
      throw new Error(`Minimum payout amount is ₹${this.minimumPayout}`);
    }

    // Get wallet
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: data.userId },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Check balance
    const balance = parseFloat(wallet.balance.toString());
    if (balance < data.amount) {
      throw new Error("Insufficient wallet balance");
    }

    // Check monthly withdrawal limit and KYC requirement
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    let currentMonthWithdrawn = parseFloat(
      wallet.currentMonthWithdrawn.toString(),
    );

    if (wallet.lastWithdrawalMonth !== currentMonth) {
      currentMonthWithdrawn = 0;
    }

    const totalMonthlyWithdrawal = currentMonthWithdrawn + data.amount;
    const kycRequired = totalMonthlyWithdrawal > this.kycThreshold;

    // Check KYC if required
    if (kycRequired) {
      const kyc = await this.prisma.kYCVerification.findUnique({
        where: { userId: data.userId },
      });

      if (!kyc || kyc.status !== "verified") {
        throw new Error(
          `KYC verification required for withdrawals above ₹${this.kycThreshold}/month. Please complete KYC verification.`,
        );
      }
    }

    // Validate payment method details
    if (data.method === "upi" && !data.upiId) {
      throw new Error("UPI ID is required for UPI payout");
    }

    if (
      (data.method === "neft" || data.method === "imps") &&
      (!data.accountNumber || !data.ifscCode || !data.accountHolderName)
    ) {
      throw new Error("Bank account details are required for NEFT/IMPS payout");
    }

    // Create payout request
    const payout = await this.prisma.payout.create({
      data: {
        userId: data.userId,
        engineerProfileId: data.engineerProfileId,
        amount: data.amount,
        method: data.method,
        upiId: data.upiId,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        accountHolderName: data.accountHolderName,
        status: "pending",
        kycRequired,
        kycVerified: kycRequired ? true : false, // Already checked above
      },
    });

    // Deduct from wallet immediately (reserved)
    await this.prisma.$transaction(async (tx) => {
      const currentWallet = await tx.wallet.findUnique({
        where: { userId: data.userId },
      });

      if (!currentWallet) {
        throw new Error("Wallet not found");
      }

      const balanceBefore = parseFloat(currentWallet.balance.toString());
      const balanceAfter = balanceBefore - data.amount;

      await tx.wallet.update({
        where: { userId: data.userId },
        data: {
          balance: balanceAfter,
          totalWithdrawn: {
            increment: data.amount,
          },
          currentMonthWithdrawn: currentMonthWithdrawn + data.amount,
          lastWithdrawalMonth: currentMonth,
        },
      });

      // Create wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletId: currentWallet.id,
          type: "debit",
          amount: data.amount,
          balanceBefore,
          balanceAfter,
          description: `Payout request - ${data.method.toUpperCase()}`,
          payoutId: payout.id,
        },
      });
    });

    // Process payout asynchronously
    this.processPayout(payout.id).catch(console.error);

    return payout;
  }

  /**
   * Process payout via Razorpay
   * UPI: instant (within 2 hours)
   * NEFT: within 24 hours
   */
  private async processPayout(payoutId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new Error("Payout not found");
    }

    try {
      // Update status to processing
      await this.prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: "processing",
          processedAt: new Date(),
        },
      });

      // Create fund account if not exists
      let fundAccountId = payout.razorpayFundAccountId;

      if (!fundAccountId) {
        const fundAccount = await this.createFundAccount(payout);
        fundAccountId = fundAccount.id;

        await this.prisma.payout.update({
          where: { id: payoutId },
          data: { razorpayFundAccountId: fundAccountId },
        });
      }

      // Create Razorpay payout
      const razorpay = this.razorpay as any;
      const razorpayPayout = await razorpay.payouts.create({
        account_number: getEnv("RAZORPAY_ACCOUNT_NUMBER"),
        fund_account_id: fundAccountId,
        amount: Math.round(Number(payout.amount) * 100), // Convert to paise
        currency: payout.currency,
        mode: this.getRazorpayMode(payout.method),
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: payout.id,
        narration: "NeuronHire payout",
      });

      // Update payout with Razorpay details
      await this.prisma.payout.update({
        where: { id: payoutId },
        data: {
          razorpayPayoutId: razorpayPayout.id,
          status:
            razorpayPayout.status === "processed" ? "completed" : "processing",
          completedAt:
            razorpayPayout.status === "processed" ? new Date() : undefined,
          utr: razorpayPayout.utr,
        },
      });

      return razorpayPayout;
    } catch (error: any) {
      // Handle payout failure
      await this.handlePayoutFailure(payoutId, error.message);
      throw error;
    }
  }

  /**
   * Create Razorpay fund account
   */
  private async createFundAccount(payout: any) {
    const contactData: any = {
      name: payout.accountHolderName || "Engineer",
      email: "engineer@neuronhire.com", // Should get from user
      contact: "9999999999", // Should get from user
      type: "vendor",
      reference_id: payout.userId,
    };

    const razorpay = this.razorpay as any;
    const contact = await razorpay.contacts.create(contactData);

    const fundAccountData: any = {
      contact_id: contact.id,
      account_type: payout.method === "upi" ? "vpa" : "bank_account",
    };

    if (payout.method === "upi") {
      fundAccountData.vpa = {
        address: payout.upiId,
      };
    } else {
      fundAccountData.bank_account = {
        name: payout.accountHolderName,
        ifsc: payout.ifscCode,
        account_number: payout.accountNumber,
      };
    }

    return await razorpay.fundAccount.create(fundAccountData);
  }

  /**
   * Get Razorpay payout mode
   */
  private getRazorpayMode(method: PayoutMethod): string {
    const modes: Record<PayoutMethod, string> = {
      upi: "UPI",
      neft: "NEFT",
      imps: "IMPS",
    };
    return modes[method];
  }

  /**
   * Handle payout failure
   */
  private async handlePayoutFailure(payoutId: string, reason: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) return;

    // Update payout status
    await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: "failed",
        failedAt: new Date(),
        failureReason: reason,
      },
    });

    // Refund to wallet
    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: payout.userId },
      });

      if (!wallet) return;

      const balanceBefore = parseFloat(wallet.balance.toString());
      const balanceAfter = balanceBefore + parseFloat(payout.amount.toString());

      await tx.wallet.update({
        where: { userId: payout.userId },
        data: {
          balance: balanceAfter,
          totalWithdrawn: {
            decrement: parseFloat(payout.amount.toString()),
          },
        },
      });

      // Create refund transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "credit",
          amount: parseFloat(payout.amount.toString()),
          balanceBefore,
          balanceAfter,
          description: `Payout failed - refund: ${reason}`,
          payoutId: payout.id,
        },
      });
    });
  }

  /**
   * Complete payout (webhook handler)
   */
  async completePayout(razorpayPayoutId: string, utr?: string) {
    const payout = await this.prisma.payout.findFirst({
      where: { razorpayPayoutId },
    });

    if (!payout) {
      throw new Error("Payout not found");
    }

    await this.prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        utr,
      },
    });

    return payout;
  }

  /**
   * Get payout status
   */
  async getPayoutStatus(payoutId: string, userId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new Error("Payout not found");
    }

    if (payout.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return payout;
  }

  /**
   * Get user's payout history
   */
  async getPayoutHistory(userId: string, limit = 20) {
    return await this.prisma.payout.findMany({
      where: { userId },
      orderBy: { requestedAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get minimum payout amount
   */
  getMinimumPayout(): number {
    return this.minimumPayout;
  }

  /**
   * Get KYC threshold
   */
  getKYCThreshold(): number {
    return this.kycThreshold;
  }
}
