import { PrismaClient, DisputeStatus, PurchaseStatus } from "@prisma/client";
import { RaiseDisputeInput, ResolveDisputeInput } from "@neuronhire/shared";

export class DisputeService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Raise dispute
   */
  async raiseDispute(
    purchaseId: string,
    userId: string,
    data: RaiseDisputeInput,
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

    if (purchase.buyerId !== userId) {
      throw new Error("Unauthorized");
    }

    if (purchase.status !== PurchaseStatus.completed) {
      throw new Error("Can only dispute completed purchases");
    }

    // Check if within 30-day dispute window
    if (!purchase.disputeEligible || new Date() > purchase.disputeDeadline) {
      throw new Error("Dispute window has expired (30 days from purchase)");
    }

    // Check if dispute already exists
    const existing = await this.prisma.dispute.findUnique({
      where: { purchaseId },
    });

    if (existing) {
      throw new Error("Dispute already exists for this purchase");
    }

    // Create dispute
    const dispute = await this.prisma.dispute.create({
      data: {
        purchaseId,
        productId: purchase.productId,
        buyerId: userId,
        sellerId: purchase.product.userId,
        reason: data.reason,
        evidence: data.evidence ?? [],
        status: DisputeStatus.open,
      },
    });

    // Update purchase status
    await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: PurchaseStatus.disputed,
      },
    });

    return dispute;
  }

  /**
   * Resolve dispute (admin only)
   */
  async resolveDispute(
    disputeId: string,
    adminId: string,
    data: ResolveDisputeInput,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        purchase: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    if (
      dispute.status !== DisputeStatus.open &&
      dispute.status !== DisputeStatus.under_review
    ) {
      throw new Error("Dispute already resolved");
    }

    // Update dispute
    const resolved = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status:
          data.resolution === "buyer"
            ? DisputeStatus.resolved_buyer
            : DisputeStatus.resolved_seller,
        resolution: data.resolutionNotes,
        resolvedBy: adminId,
        resolvedAt: new Date(),
        refundAmount: data.refundAmount,
      },
    });

    // If resolved in favor of buyer, process refund
    if (data.resolution === "buyer" && data.refundAmount) {
      await this.processRefund(disputeId, data.refundAmount);
    }

    // Update purchase status
    await this.prisma.purchase.update({
      where: { id: dispute.purchaseId },
      data: {
        status:
          data.resolution === "buyer"
            ? PurchaseStatus.refunded
            : PurchaseStatus.completed,
      },
    });

    return resolved;
  }

  /**
   * Process refund
   */
  private async processRefund(disputeId: string, amount: number) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        purchase: true,
      },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    try {
      // TODO: Implement actual Razorpay refund
      const refundId = `refund_${Date.now()}_${disputeId}`;

      console.log(`Processing refund: ${refundId} for ₹${amount}`);

      // Update dispute with refund info
      await this.prisma.dispute.update({
        where: { id: disputeId },
        data: {
          refundProcessed: true,
          refundId,
        },
      });

      // Revoke license
      await this.prisma.purchase.update({
        where: { id: dispute.purchaseId },
        data: {
          licenseActive: false,
          licenseRevokedAt: new Date(),
        },
      });

      // Update analytics
      await this.trackRefund(dispute.productId);

      return {
        success: true,
        refundId,
      };
    } catch (error) {
      console.error("Refund error:", error);
      throw new Error("Failed to process refund");
    }
  }

  /**
   * Get dispute by ID
   */
  async getDispute(disputeId: string, userId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        purchase: {
          include: {
            product: {
              select: {
                name: true,
                thumbnailUrl: true,
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    // Check authorization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (
      user.role !== "admin" &&
      dispute.buyerId !== userId &&
      dispute.sellerId !== userId
    ) {
      throw new Error("Unauthorized");
    }

    return dispute;
  }

  /**
   * Get buyer's disputes
   */
  async getBuyerDisputes(buyerId: string) {
    return await this.prisma.dispute.findMany({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
      include: {
        purchase: {
          include: {
            product: {
              select: {
                name: true,
                thumbnailUrl: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get seller's disputes
   */
  async getSellerDisputes(sellerId: string) {
    return await this.prisma.dispute.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      include: {
        purchase: {
          include: {
            product: {
              select: {
                name: true,
                thumbnailUrl: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get all open disputes (admin only)
   */
  async getOpenDisputes() {
    return await this.prisma.dispute.findMany({
      where: {
        status: {
          in: [DisputeStatus.open, DisputeStatus.under_review],
        },
      },
      orderBy: { createdAt: "asc" },
      include: {
        purchase: {
          include: {
            product: {
              select: {
                name: true,
                thumbnailUrl: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Mark dispute as under review
   */
  async markUnderReview(disputeId: string, _adminId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    if (dispute.status !== DisputeStatus.open) {
      throw new Error("Dispute is not open");
    }

    return await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.under_review,
      },
    });
  }

  /**
   * Track refund in analytics
   */
  private async trackRefund(productId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.productAnalytics.upsert({
      where: {
        productId_date: {
          productId,
          date: today,
        },
      },
      create: {
        productId,
        date: today,
        refunds: 1,
      },
      update: {
        refunds: { increment: 1 },
      },
    });
  }
}
