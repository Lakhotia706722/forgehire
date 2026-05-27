import { PrismaClient, ContractDisputeStatus } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "../config/env";
import { EscrowService } from "./escrow.service";

export class ContractDisputeService {
  private prisma: PrismaClient;
  private anthropic: Anthropic;
  private escrowService: EscrowService;

  constructor() {
    this.prisma = new PrismaClient();
    this.anthropic = new Anthropic({
      apiKey: getEnv("ANTHROPIC_API_KEY"),
    });
    this.escrowService = new EscrowService();
  }

  /**
   * Raise contract dispute
   * Can be raised within 72-hour review window or 7 days of final delivery
   */
  async raiseDispute(data: {
    contractId: string;
    raisedBy: string;
    againstUserId: string;
    reason: string;
    description: string;
    evidence?: any[];
  }) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: data.contractId },
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    // Check if user is part of the contract
    if (
      contract.companyUserId !== data.raisedBy &&
      contract.engineerUserId !== data.raisedBy
    ) {
      throw new Error("Unauthorized to raise dispute on this contract");
    }

    // Check if within dispute window (7 days from contract completion)
    if (contract.completedAt) {
      const daysSinceCompletion =
        (Date.now() - contract.completedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCompletion > 7) {
        throw new Error(
          "Dispute window has expired (7 days from final delivery)",
        );
      }
    }

    // Check if dispute already exists
    const existing = await this.prisma.contractDispute.findFirst({
      where: {
        contractId: data.contractId,
        status: {
          in: [
            ContractDisputeStatus.pending,
            ContractDisputeStatus.under_review,
          ],
        },
      },
    });

    if (existing) {
      throw new Error("An active dispute already exists for this contract");
    }

    // Calculate review deadline (72 hours)
    const reviewDeadline = new Date();
    reviewDeadline.setHours(reviewDeadline.getHours() + 72);

    // Create dispute
    const dispute = await this.prisma.contractDispute.create({
      data: {
        contractId: data.contractId,
        raisedBy: data.raisedBy,
        againstUserId: data.againstUserId,
        reason: data.reason,
        description: data.description,
        evidence: data.evidence || [],
        status: ContractDisputeStatus.pending,
        reviewDeadline,
      },
    });

    // Update contract status
    await this.prisma.contract.update({
      where: { id: data.contractId },
      data: { status: "disputed" as any },
    });

    return dispute;
  }

  /**
   * Submit evidence for dispute
   */
  async submitEvidence(disputeId: string, userId: string, evidence: any[]) {
    const dispute = await this.prisma.contractDispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    // Check authorization
    if (dispute.raisedBy !== userId && dispute.againstUserId !== userId) {
      throw new Error("Unauthorized");
    }

    if (
      dispute.status !== ContractDisputeStatus.pending &&
      dispute.status !== ContractDisputeStatus.under_review
    ) {
      throw new Error("Cannot submit evidence for resolved dispute");
    }

    // Append evidence
    const currentEvidence = (dispute.evidence as any[]) || [];
    const updatedEvidence = [...currentEvidence, ...evidence];

    return await this.prisma.contractDispute.update({
      where: { id: disputeId },
      data: {
        evidence: updatedEvidence,
      },
    });
  }

  /**
   * Start AI audit of dispute
   * Analyzes chat logs, deliverables, and contract scope
   */
  async startAIAudit(disputeId: string) {
    const dispute = await this.prisma.contractDispute.findUnique({
      where: { id: disputeId },
      include: {
        contract: {
          include: {
            milestonePayments: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    // Update status to under review
    await this.prisma.contractDispute.update({
      where: { id: disputeId },
      data: {
        status: ContractDisputeStatus.under_review,
        reviewStartedAt: new Date(),
      },
    });

    // Prepare context for AI
    const context = this.prepareAuditContext(dispute);

    // Call Claude API for analysis
    const aiAnalysis = await this.performAIAnalysis(context);

    // Store AI audit results
    await this.prisma.contractDispute.update({
      where: { id: disputeId },
      data: {
        aiAuditSummary: aiAnalysis.summary,
        aiRecommendation: aiAnalysis.recommendation,
      },
    });

    return aiAnalysis;
  }

  /**
   * Prepare context for AI audit
   */
  private prepareAuditContext(dispute: any): string {
    const contract = dispute.contract;

    let context = `# Contract Dispute Analysis\n\n`;
    context += `## Contract Details\n`;
    context += `- Type: ${contract.type}\n`;
    context += `- Total Amount: ₹${contract.totalAmount}\n`;
    context += `- Start Date: ${contract.startDate}\n`;
    context += `- End Date: ${contract.endDate || "Ongoing"}\n`;
    context += `- Status: ${contract.status}\n\n`;

    context += `## Dispute Details\n`;
    context += `- Reason: ${dispute.reason}\n`;
    context += `- Description: ${dispute.description}\n\n`;

    context += `## Milestones\n`;
    const milestones = contract.milestonePayments || [];
    milestones.forEach((m: any, i: number) => {
      context += `${i + 1}. ${m.title} - ₹${m.amount} - Status: ${m.status}\n`;
      if (m.description) context += `   Description: ${m.description}\n`;
    });
    context += `\n`;

    context += `## Evidence Submitted\n`;
    const evidence = (dispute.evidence as any[]) || [];
    evidence.forEach((e: any, i: number) => {
      context += `${i + 1}. ${e.type}: ${e.description}\n`;
      if (e.url) context += `   URL: ${e.url}\n`;
    });

    return context;
  }

  /**
   * Perform AI analysis using Claude
   */
  private async performAIAnalysis(context: string): Promise<{
    summary: string;
    recommendation: any;
  }> {
    try {
      const message = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `${context}\n\nAnalyze this contract dispute and provide:
1. A summary of the key issues
2. Assessment of deliverable quality vs stated scope
3. Analysis of communication patterns
4. Recommended resolution (percentage split of escrow)
5. Reasoning for the recommendation

Format your response as JSON:
{
  "summary": "Brief summary of the dispute",
  "keyIssues": ["issue1", "issue2"],
  "deliverableAssessment": "Assessment of work quality",
  "communicationAnalysis": "Analysis of communication",
  "recommendedSplit": {
    "engineerPercentage": 60,
    "companyPercentage": 40,
    "reasoning": "Explanation"
  }
}`,
          },
        ],
      });

      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";

      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response");
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        summary: analysis.summary,
        recommendation: analysis,
      };
    } catch (error: any) {
      console.error("AI audit error:", error);

      // Fallback to default 50-50 split
      return {
        summary: "AI audit failed. Manual review required.",
        recommendation: {
          summary: "AI audit failed",
          recommendedSplit: {
            engineerPercentage: 50,
            companyPercentage: 50,
            reasoning: "Default 50-50 split due to AI audit failure",
          },
        },
      };
    }
  }

  /**
   * Resolve dispute with partial release
   * Admin-only endpoint
   */
  async resolveDispute(data: {
    disputeId: string;
    resolvedBy: string;
    resolution: string;
    engineerPercentage: number;
    companyPercentage: number;
  }) {
    const dispute = await this.prisma.contractDispute.findUnique({
      where: { id: data.disputeId },
      include: { contract: true },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    if (dispute.status === ContractDisputeStatus.resolved) {
      throw new Error("Dispute already resolved");
    }

    // Validate percentages
    if (data.engineerPercentage + data.companyPercentage !== 100) {
      throw new Error("Percentages must sum to 100");
    }

    // Get escrow account
    const escrow = await this.escrowService.getEscrowAccount(
      dispute.contractId,
    );

    if (!escrow) {
      throw new Error("Escrow account not found");
    }

    // Calculate amounts
    const availableBalance =
      parseFloat(escrow.lockedAmount.toString()) -
      parseFloat(escrow.releasedAmount.toString()) -
      parseFloat(escrow.refundedAmount.toString());

    const engineerAmount = (availableBalance * data.engineerPercentage) / 100;
    const companyRefund = (availableBalance * data.companyPercentage) / 100;

    // Update dispute
    const resolved = await this.prisma.contractDispute.update({
      where: { id: data.disputeId },
      data: {
        status: ContractDisputeStatus.resolved,
        resolvedBy: data.resolvedBy,
        resolution: data.resolution,
        engineerAmount,
        companyRefund,
        resolvedAt: new Date(),
      },
    });

    // Process partial release to engineer
    if (engineerAmount > 0) {
      await this.escrowService.releaseMilestone({
        escrowAccountId: escrow.id,
        milestoneId: `dispute_${dispute.id}`,
        amount: engineerAmount,
        recipientUserId: dispute.contract.engineerUserId,
        approvedBy: data.resolvedBy,
      });
    }

    // Process refund to company
    if (companyRefund > 0) {
      await this.escrowService.refundEscrow({
        escrowAccountId: escrow.id,
        amount: companyRefund,
        recipientUserId: dispute.contract.companyUserId,
        reason: `Dispute resolution - ${data.resolution}`,
      });
    }

    // Update contract status
    await this.prisma.contract.update({
      where: { id: dispute.contractId },
      data: {
        status: "terminated",
      },
    });

    return resolved;
  }

  /**
   * Escalate dispute
   */
  async escalateDispute(disputeId: string, _escalatedBy: string) {
    const dispute = await this.prisma.contractDispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    return await this.prisma.contractDispute.update({
      where: { id: disputeId },
      data: {
        status: ContractDisputeStatus.escalated,
      },
    });
  }

  /**
   * Get dispute details
   */
  async getDispute(disputeId: string, userId: string) {
    const dispute = await this.prisma.contractDispute.findUnique({
      where: { id: disputeId },
      include: { contract: true },
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
      dispute.raisedBy !== userId &&
      dispute.againstUserId !== userId
    ) {
      throw new Error("Unauthorized");
    }

    return dispute;
  }

  /**
   * Get user's disputes
   */
  async getUserDisputes(userId: string) {
    return await this.prisma.contractDispute.findMany({
      where: {
        OR: [{ raisedBy: userId }, { againstUserId: userId }],
      },
      include: {
        contract: {
          select: {
            hiringMode: true,
            totalAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get all open disputes (admin only)
   */
  async getOpenDisputes() {
    return await this.prisma.contractDispute.findMany({
      where: {
        status: {
          in: [
            ContractDisputeStatus.pending,
            ContractDisputeStatus.under_review,
            ContractDisputeStatus.escalated,
          ],
        },
      },
      include: {
        contract: {
          select: {
            hiringMode: true,
            totalAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Get dispute statistics
   */
  async getDisputeStats() {
    const total = await this.prisma.contractDispute.count();
    const pending = await this.prisma.contractDispute.count({
      where: { status: ContractDisputeStatus.pending },
    });
    const underReview = await this.prisma.contractDispute.count({
      where: { status: ContractDisputeStatus.under_review },
    });
    const resolved = await this.prisma.contractDispute.count({
      where: { status: ContractDisputeStatus.resolved },
    });
    const escalated = await this.prisma.contractDispute.count({
      where: { status: ContractDisputeStatus.escalated },
    });

    return {
      total,
      pending,
      underReview,
      resolved,
      escalated,
    };
  }
}
