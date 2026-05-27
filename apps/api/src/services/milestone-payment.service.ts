import { PrismaClient, MilestoneStatus } from "@prisma/client";
import { RazorpayEscrowService } from "./razorpay-escrow.service";

export class MilestonePaymentService {
  private prisma: PrismaClient;
  private escrowService: RazorpayEscrowService;

  constructor() {
    this.prisma = new PrismaClient();
    this.escrowService = new RazorpayEscrowService();
  }

  /**
   * Submit milestone for approval
   */
  async submitMilestone(
    milestoneId: string,
    engineerUserId: string,
    data: {
      submissionNotes: string;
      deliverables?: any[];
    },
  ) {
    const milestone = await this.prisma.milestonePayment.findUnique({
      where: { id: milestoneId },
      include: { contract: true },
    });

    if (!milestone) {
      throw new Error("Milestone not found");
    }

    if (milestone.contract.engineerUserId !== engineerUserId) {
      throw new Error("Unauthorized");
    }

    if (
      milestone.status !== MilestoneStatus.pending &&
      milestone.status !== MilestoneStatus.in_progress
    ) {
      throw new Error("Milestone cannot be submitted in current status");
    }

    return await this.prisma.milestonePayment.update({
      where: { id: milestoneId },
      data: {
        status: MilestoneStatus.submitted,
        submittedAt: new Date(),
        submissionNotes: data.submissionNotes,
        deliverables: data.deliverables || undefined,
      },
    });
  }

  /**
   * Approve milestone and release payment
   */
  async approveMilestone(
    milestoneId: string,
    companyUserId: string,
    approvalNotes?: string,
  ) {
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

    if (milestone.contract.companyUserId !== companyUserId) {
      throw new Error("Unauthorized");
    }

    if (milestone.status !== MilestoneStatus.submitted) {
      throw new Error("Milestone must be submitted before approval");
    }

    // Create escrow order for milestone
    const amount = parseFloat(milestone.amount.toString());

    if (!milestone.contract.engineerProfile.upiId) {
      throw new Error("Engineer UPI ID not configured");
    }

    // Release payment
    const payout = await this.escrowService.releaseEscrow(
      milestone.contractId,
      milestone.contract.engineerProfile.upiId,
      amount,
      milestone.contract.currency,
    );

    // Update milestone
    return await this.prisma.milestonePayment.update({
      where: { id: milestoneId },
      data: {
        status: MilestoneStatus.approved,
        approvedAt: new Date(),
        approvalNotes,
        payoutId: payout.payoutId,
      },
    });
  }

  /**
   * Mark milestone as paid (after payout completes)
   */
  async markMilestonePaid(milestoneId: string) {
    return await this.prisma.milestonePayment.update({
      where: { id: milestoneId },
      data: {
        status: MilestoneStatus.paid,
        paidAt: new Date(),
      },
    });
  }

  /**
   * Start working on milestone
   */
  async startMilestone(milestoneId: string, engineerUserId: string) {
    const milestone = await this.prisma.milestonePayment.findUnique({
      where: { id: milestoneId },
      include: { contract: true },
    });

    if (!milestone) {
      throw new Error("Milestone not found");
    }

    if (milestone.contract.engineerUserId !== engineerUserId) {
      throw new Error("Unauthorized");
    }

    if (milestone.status !== MilestoneStatus.pending) {
      throw new Error("Milestone is not in pending status");
    }

    return await this.prisma.milestonePayment.update({
      where: { id: milestoneId },
      data: {
        status: MilestoneStatus.in_progress,
      },
    });
  }

  /**
   * Get milestones for contract
   */
  async getContractMilestones(contractId: string) {
    return await this.prisma.milestonePayment.findMany({
      where: { contractId },
      orderBy: { milestoneNumber: "asc" },
    });
  }

  /**
   * Get milestone details
   */
  async getMilestone(milestoneId: string, userId: string) {
    const milestone = await this.prisma.milestonePayment.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            companyProfile: {
              select: {
                companyName: true,
              },
            },
            engineerProfile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      throw new Error("Milestone not found");
    }

    // Check authorization
    if (
      milestone.contract.companyUserId !== userId &&
      milestone.contract.engineerUserId !== userId
    ) {
      throw new Error("Unauthorized");
    }

    return milestone;
  }

  /**
   * Check if milestone release should be triggered
   */
  shouldReleaseMilestone(milestone: any): boolean {
    return milestone.status === MilestoneStatus.approved && !milestone.paidAt;
  }
}
