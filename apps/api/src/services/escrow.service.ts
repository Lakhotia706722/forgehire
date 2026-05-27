import { PrismaClient } from "@prisma/client";
import Razorpay from "razorpay";
import { getEnv } from "../config/env";
import crypto from "crypto";

export class EscrowService {
  private prisma: PrismaClient;
  private razorpay: Razorpay;

  constructor() {
    this.prisma = new PrismaClient();
    this.razorpay = new Razorpay({
      key_id: getEnv("RAZORPAY_KEY_ID"),
      key_secret: getEnv("RAZORPAY_KEY_SECRET"),
    });
  }

  /**
   * Create escrow account and deposit funds
   * NO WORK CAN START WITHOUT FUNDED ESCROW
   */
  async depositEscrow(data: {
    contractId?: string;
    taskId?: string;
    userId: string;
    amount: number;
    currency?: string;
  }) {
    if (!data.contractId && !data.taskId) {
      throw new Error("Either contractId or taskId is required");
    }

    // Check if escrow already exists
    const existing = await this.prisma.escrowAccount.findFirst({
      where: {
        OR: [{ contractId: data.contractId }, { taskId: data.taskId }],
      },
    });

    if (existing && existing.funded) {
      throw new Error("Escrow already funded for this contract/task");
    }

    // Create Razorpay order
    const order = (await this.razorpay.orders.create({
      amount: Math.round(data.amount * 100), // Convert to paise
      currency: data.currency || "INR",
      receipt: `escrow_${data.contractId || data.taskId}`,
      notes: {
        type: "escrow_deposit",
        contractId: data.contractId ?? "",
        taskId: data.taskId ?? "",
      },
    })) as any; // Razorpay SDK types are incomplete

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        userId: data.userId,
        type: "escrow_deposit",
        status: "pending",
        amount: data.amount,
        currency: data.currency || "INR",
        razorpayOrderId: order.id as string,
        contractId: data.contractId ?? null,
        taskId: data.taskId ?? null,
        description: "Escrow deposit",
        idempotencyKey: `escrow_${order.id as string}`,
      },
    });

    // Create or update escrow account
    const escrowAccount = existing
      ? await this.prisma.escrowAccount.update({
          where: { id: existing.id },
          data: {
            totalAmount: data.amount,
            lockedAmount: data.amount,
          },
        })
      : await this.prisma.escrowAccount.create({
          data: {
            contractId: data.contractId,
            taskId: data.taskId,
            totalAmount: data.amount,
            lockedAmount: data.amount,
            currency: data.currency || "INR",
          },
        });

    return {
      orderId: order.id,
      amount: data.amount,
      currency: data.currency || "INR",
      escrowAccountId: escrowAccount.id,
      paymentId: payment.id,
    };
  }

  /**
   * Verify escrow payment and mark as funded
   */
  async verifyEscrowPayment(data: {
    orderId: string;
    paymentId: string;
    signature: string;
  }) {
    // Verify signature
    const isValid = this.verifyRazorpaySignature(
      data.orderId,
      data.paymentId,
      data.signature,
    );

    if (!isValid) {
      throw new Error("Invalid payment signature");
    }

    // Update payment record
    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId: data.orderId },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "completed",
        razorpayPaymentId: data.paymentId,
        razorpaySignature: data.signature,
        completedAt: new Date(),
      },
    });

    // Mark escrow as funded
    const escrowAccount = await this.prisma.escrowAccount.findFirst({
      where: {
        OR: [{ contractId: payment.contractId! }, { taskId: payment.taskId! }],
      },
    });

    if (escrowAccount) {
      await this.prisma.escrowAccount.update({
        where: { id: escrowAccount.id },
        data: {
          funded: true,
          fundedAt: new Date(),
        },
      });
    }

    return { success: true, escrowAccountId: escrowAccount?.id };
  }

  /**
   * Check if escrow is funded (API-level enforcement)
   */
  async isEscrowFunded(contractId?: string, taskId?: string): Promise<boolean> {
    if (!contractId && !taskId) {
      return false;
    }

    const escrow = await this.prisma.escrowAccount.findFirst({
      where: {
        OR: [{ contractId }, { taskId }],
      },
    });

    return escrow?.funded || false;
  }

  /**
   * Release milestone amount from escrow
   * Uses database transaction to prevent double-release
   */
  async releaseMilestone(data: {
    escrowAccountId: string;
    milestoneId: string;
    amount: number;
    recipientUserId: string;
    approvedBy?: string;
    autoApprove?: boolean;
  }) {
    const idempotencyKey = `release_${data.milestoneId}_${Date.now()}`;

    // Use transaction for atomic operation
    return await this.prisma.$transaction(async (tx) => {
      // Check if already released
      const existing = await tx.escrowRelease.findFirst({
        where: {
          escrowAccountId: data.escrowAccountId,
          payment: {
            milestoneId: data.milestoneId,
          },
        },
      });

      if (existing) {
        throw new Error("Milestone already released");
      }

      // Get escrow account with lock
      const escrow = await tx.escrowAccount.findUnique({
        where: { id: data.escrowAccountId },
      });

      if (!escrow) {
        throw new Error("Escrow account not found");
      }

      if (!escrow.funded) {
        throw new Error("Escrow not funded");
      }

      // Check available balance
      const availableBalance =
        parseFloat(escrow.lockedAmount.toString()) -
        parseFloat(escrow.releasedAmount.toString());

      if (availableBalance < data.amount) {
        throw new Error("Insufficient escrow balance");
      }

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          userId: data.recipientUserId,
          type: "milestone_release",
          status: "processing",
          amount: data.amount,
          currency: escrow.currency,
          milestoneId: data.milestoneId,
          description: "Milestone payment release",
          idempotencyKey,
        },
      });

      // Create escrow release record
      const release = await tx.escrowRelease.create({
        data: {
          escrowAccountId: data.escrowAccountId,
          paymentId: payment.id,
          amount: data.amount,
          recipientUserId: data.recipientUserId,
          triggeredBy: data.autoApprove ? "auto_approve" : "approval",
          approvedBy: data.approvedBy,
          autoApproved: data.autoApprove || false,
          status: "processing",
          idempotencyKey,
        },
      });

      // Update escrow account
      await tx.escrowAccount.update({
        where: { id: data.escrowAccountId },
        data: {
          releasedAmount: {
            increment: data.amount,
          },
        },
      });

      return { release, payment };
    });
  }

  /**
   * Complete escrow release (called after successful payout)
   */
  async completeRelease(releaseId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const release = await tx.escrowRelease.update({
        where: { id: releaseId },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
        include: {
          payment: true,
        },
      });

      await tx.payment.update({
        where: { id: release.paymentId },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      });

      return release;
    });
  }

  /**
   * Schedule auto-approve for milestone (72 hours)
   */
  async scheduleAutoApprove(milestoneId: string, escrowAccountId: string) {
    const autoApproveAt = new Date();
    autoApproveAt.setHours(autoApproveAt.getHours() + 72);

    // This will be picked up by BullMQ job
    return { milestoneId, escrowAccountId, autoApproveAt };
  }

  /**
   * Process auto-approve (called by BullMQ job)
   */
  async processAutoApprove(milestoneId: string) {
    const milestone = await this.prisma.milestonePayment.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            engineerProfile: true,
          },
        },
      },
    });

    if (!milestone) {
      throw new Error("Milestone not found");
    }

    if (milestone.status !== "submitted") {
      // Already approved or not submitted
      return { skipped: true };
    }

    // Get escrow account
    const escrow = await this.prisma.escrowAccount.findFirst({
      where: { contractId: milestone.contractId },
    });

    if (!escrow) {
      throw new Error("Escrow account not found");
    }

    // Release milestone
    const result = await this.releaseMilestone({
      escrowAccountId: escrow.id,
      milestoneId: milestone.id,
      amount: parseFloat(milestone.amount.toString()),
      recipientUserId: milestone.contract.engineerUserId,
      autoApprove: true,
    });

    // Update milestone status
    await this.prisma.milestonePayment.update({
      where: { id: milestoneId },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvalNotes: "Auto-approved after 72 hours",
      },
    });

    return result;
  }

  /**
   * Refund escrow (for disputes or cancellations)
   */
  async refundEscrow(data: {
    escrowAccountId: string;
    amount: number;
    recipientUserId: string;
    reason: string;
  }) {
    return await this.prisma.$transaction(async (tx) => {
      const escrow = await tx.escrowAccount.findUnique({
        where: { id: data.escrowAccountId },
      });

      if (!escrow) {
        throw new Error("Escrow account not found");
      }

      const availableBalance =
        parseFloat(escrow.lockedAmount.toString()) -
        parseFloat(escrow.releasedAmount.toString()) -
        parseFloat(escrow.refundedAmount.toString());

      if (availableBalance < data.amount) {
        throw new Error("Insufficient escrow balance for refund");
      }

      // Create refund payment
      const payment = await tx.payment.create({
        data: {
          userId: data.recipientUserId,
          type: "refund",
          status: "processing",
          amount: data.amount,
          currency: escrow.currency,
          contractId: escrow.contractId,
          taskId: escrow.taskId,
          description: data.reason,
          idempotencyKey: `refund_${data.escrowAccountId}_${Date.now()}`,
        },
      });

      // Update escrow account
      await tx.escrowAccount.update({
        where: { id: data.escrowAccountId },
        data: {
          refundedAmount: {
            increment: data.amount,
          },
        },
      });

      return payment;
    });
  }

  /**
   * Verify Razorpay signature
   */
  private verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const text = `${orderId}|${paymentId}`;
    const generated = crypto
      .createHmac("sha256", getEnv("RAZORPAY_KEY_SECRET"))
      .update(text)
      .digest("hex");

    return generated === signature;
  }

  /**
   * Get escrow account details
   */
  async getEscrowAccount(contractId?: string, taskId?: string) {
    return await this.prisma.escrowAccount.findFirst({
      where: {
        OR: [{ contractId }, { taskId }],
      },
      include: {
        releases: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }
}
