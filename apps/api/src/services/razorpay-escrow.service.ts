import Razorpay from "razorpay";
import { getEnv } from "../config/env";

export class RazorpayEscrowService {
  private razorpay: Razorpay;

  constructor() {
    const env = getEnv();
    this.razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }

  /**
   * Create escrow order for task
   */
  async createEscrowOrder(
    taskId: string,
    amount: number,
    currency: string = "INR",
  ): Promise<{ orderId: string; amount: number }> {
    try {
      const order = await this.razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency,
        receipt: `task_${taskId}`,
        notes: {
          taskId,
          type: "escrow",
        },
      });

      return {
        orderId: (order as any).id,
        amount: (order as any).amount / 100,
      };
    } catch (error) {
      console.error("Escrow order creation error:", error);
      throw new Error("Failed to create escrow order");
    }
  }

  /**
   * Verify escrow payment
   */
  async verifyEscrowPayment(
    orderId: string,
    paymentId: string,
    signature: string,
  ): Promise<boolean> {
    try {
      const crypto = require("crypto");
      const env = getEnv();

      const generatedSignature = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      return generatedSignature === signature;
    } catch (error) {
      console.error("Payment verification error:", error);
      return false;
    }
  }

  /**
   * Release escrow to winner
   */
  async releaseEscrow(
    taskId: string,
    engineerUpiId: string,
    amount: number,
    _currency: string = "INR",
  ): Promise<{ payoutId: string; status: string }> {
    try {
      const contact = await (this.razorpay as any).contacts.create({
        name: `Engineer ${taskId.slice(0, 8)}`,
        type: "employee",
      });
      const fundAccount = await (this.razorpay as any).fundAccount.create({
        contact_id: contact.id,
        account_type: "vpa",
        vpa: {
          address: engineerUpiId,
        },
      });
      const payout = await (this.razorpay as any).payouts.create({
        account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER || "",
        fund_account_id: fundAccount.id,
        amount: Math.round(amount * 100),
        currency: "INR",
        mode: "UPI",
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: `milestone_${taskId.slice(0, 16)}`,
        narration: "NeuronHire milestone release",
      });

      return {
        payoutId: payout.id,
        status: payout.status ?? "processing",
      };
    } catch (error) {
      console.error("Escrow release error:", error);
      throw new Error("Failed to release escrow");
    }
  }

  /**
   * Release escrow with multiple winners (contest mode)
   */
  async releaseEscrowMultiple(
    taskId: string,
    payouts: Array<{
      engineerUpiId: string;
      amount: number;
      rank: number;
    }>,
    currency: string = "INR",
  ): Promise<Array<{ payoutId: string; status: string; rank: number }>> {
    const results = [];

    for (const payout of payouts) {
      try {
        const result = await this.releaseEscrow(
          `${taskId}_rank${payout.rank}`,
          payout.engineerUpiId,
          payout.amount,
          currency,
        );

        results.push({
          ...result,
          rank: payout.rank,
        });
      } catch (error) {
        console.error(`Payout failed for rank ${payout.rank}:`, error);
        results.push({
          payoutId: "",
          status: "failed",
          rank: payout.rank,
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
      const payout = await (this.razorpay as any).payouts.fetch(payoutId);
      return payout.status ?? "unknown";
    } catch (error) {
      console.error("Get payout status error:", error);
      return "unknown";
    }
  }

  /**
   * Refund escrow (if task cancelled)
   */
  async refundEscrow(
    paymentId: string,
    amount: number,
  ): Promise<{ refundId: string; status: string }> {
    try {
      const refund = await this.razorpay.payments.refund(paymentId, {
        amount: amount * 100, // Convert to paise
        speed: "normal",
      });

      return {
        refundId: refund.id,
        status: refund.status,
      };
    } catch (error) {
      console.error("Refund error:", error);
      throw new Error("Failed to process refund");
    }
  }
}
