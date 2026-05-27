import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

/**
 * DPDP Act 2023 Compliance Service
 * Handles consent management, right to delete, and data retention
 */
export class DPDPComplianceService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Record user consent
   */
  async recordConsent(data: {
    userId: string;
    consentType:
      | "marketing_email"
      | "profile_recommendations"
      | "webcam_proctoring"
      | "public_activity";
    granted: boolean;
    ipAddress: string;
    userAgent: string;
  }) {
    return await this.prisma.userConsent.create({
      data: {
        userId: data.userId,
        consentType: data.consentType,
        granted: data.granted,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: new Date(),
      },
    });
  }

  /**
   * Get user consents
   */
  async getUserConsents(userId: string) {
    const consents = await this.prisma.userConsent.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      distinct: ["consentType"],
    });

    return {
      marketingEmail:
        consents.find((c) => c.consentType === "marketing_email")?.granted ||
        false,
      profileRecommendations:
        consents.find((c) => c.consentType === "profile_recommendations")
          ?.granted || false,
      webcamProctoring:
        consents.find((c) => c.consentType === "webcam_proctoring")?.granted ||
        false,
      publicActivity:
        consents.find((c) => c.consentType === "public_activity")?.granted ||
        false,
    };
  }

  /**
   * Update consent
   */
  async updateConsent(data: {
    userId: string;
    consentType: string;
    granted: boolean;
    ipAddress: string;
    userAgent: string;
  }) {
    return await this.recordConsent(data as any);
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(
    userId: string,
    consentType: string,
    ipAddress: string,
    userAgent: string,
  ) {
    return await this.recordConsent({
      userId,
      consentType: consentType as any,
      granted: false,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Right to delete - Anonymize user data
   * Retains financial records for 7 years as required by law
   */
  async requestAccountDeletion(userId: string, reason?: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Create deletion request
    const deletionRequest = await this.prisma.accountDeletionRequest.create({
      data: {
        userId,
        reason,
        requestedAt: new Date(),
        scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: "pending",
      },
    });

    return deletionRequest;
  }

  /**
   * Process account deletion (called by scheduled job after 30 days)
   */
  async processAccountDeletion(deletionRequestId: string) {
    const request = await this.prisma.accountDeletionRequest.findUnique({
      where: { id: deletionRequestId },
      include: { user: true },
    });

    if (!request) {
      throw new Error("Deletion request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Deletion request already processed");
    }

    const userId = request.userId;

    // Anonymize user data
    const anonymizedEmail = `deleted_${crypto.randomBytes(8).toString("hex")}@deleted.neuronhire.com`;
    // anonymizedName kept for audit trail purposes but not stored (PII removed)

    await this.prisma.$transaction(async (tx) => {
      // Anonymize user
      await tx.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          clerkId: `deleted_${crypto.randomBytes(8).toString("hex")}`,
        },
      });

      // Anonymize engineer profile
      await tx.engineerProfile.updateMany({
        where: { userId },
        data: {
          bio: "Account deleted",
          location: null,
          githubUrl: null,
          linkedinUrl: null,
          portfolioUrl: null,
        },
      });

      // Anonymize company profile
      await tx.companyProfile.updateMany({
        where: { userId },
        data: {
          description: "Account deleted",
          website: null,
          location: null,
          logoUrl: null,
        },
      });

      // Delete assessment recordings (not financial)
      // Note: assessmentSubmission model doesn't exist in schema, using Assessment instead
      await tx.assessment.updateMany({
        where: { userId },
        data: {
          proctoringEvents: {} as any,
        },
      });

      // Delete chat messages (not financial)
      await tx.message.deleteMany({
        where: { senderId: userId },
      });

      // Anonymize messages in project chat
      await tx.projectChatMessage.updateMany({
        where: { senderId: userId },
        data: {
          content: "[Message deleted]",
          fileUrl: null,
        },
      });

      // Keep financial records (payments, invoices, contracts) for 7 years
      // Just mark them as belonging to deleted user

      // Update deletion request
      await tx.accountDeletionRequest.update({
        where: { id: deletionRequestId },
        data: {
          status: "completed",
          processedAt: new Date(),
        },
      });
    });

    return { success: true, message: "Account anonymized successfully" };
  }

  /**
   * Cancel account deletion request (within 30 days)
   */
  async cancelAccountDeletion(userId: string) {
    const request = await this.prisma.accountDeletionRequest.findFirst({
      where: {
        userId,
        status: "pending",
      },
      orderBy: { requestedAt: "desc" },
    });

    if (!request) {
      throw new Error("No pending deletion request found");
    }

    await this.prisma.accountDeletionRequest.update({
      where: { id: request.id },
      data: {
        status: "cancelled",
        processedAt: new Date(),
      },
    });

    return { success: true, message: "Deletion request cancelled" };
  }

  /**
   * Get data retention status
   */
  async getDataRetentionStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        assessments: {
          select: {
            id: true,
            createdAt: true,
            proctoringEvents: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Assessment recordings to be deleted
    const recordingsToDelete = user.assessments.filter(
      (s) => s.proctoringEvents && s.createdAt < ninetyDaysAgo,
    );

    return {
      assessmentRecordings: {
        total: user.assessments.length,
        toBeDeleted: recordingsToDelete.length,
        retentionPeriod: "90 days",
      },
      chatMessages: {
        retentionPeriod: "2 years",
      },
      financialRecords: {
        retentionPeriod: "7 years (legal requirement)",
      },
    };
  }

  /**
   * Delete old assessment recordings (scheduled job - runs daily)
   */
  async deleteOldAssessmentRecordings() {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const recordings = await this.prisma.assessment.findMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo,
        },
        proctoringEvents: {
          not: {} as any,
        },
      },
    });

    let deletedCount = 0;

    for (const recording of recordings) {
      try {
        // Delete from S3
        if (recording.proctoringEvents) {
          // TODO: Implement S3 deletion
          console.log(`Deleting recording: ${recording.id}`);
        }

        // Remove reference from database
        await this.prisma.assessment.update({
          where: { id: recording.id },
          data: {
            proctoringEvents: {} as any,
          },
        });

        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete recording ${recording.id}:`, error);
      }
    }

    return {
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} assessment recordings older than 90 days`,
    };
  }

  /**
   * Delete old chat messages (scheduled job - runs monthly)
   */
  async deleteOldChatMessages() {
    const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.message.deleteMany({
      where: {
        createdAt: {
          lt: twoYearsAgo,
        },
      },
    });

    return {
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} messages older than 2 years`,
    };
  }

  /**
   * Export user data (DPDP right to data portability)
   */
  async exportUserData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        engineerProfile: true,
        companyProfile: true,
        assessments: true,
        tasks: true,
        companyContracts: true,
        engineerContracts: true,
        payments: true,
        wallet: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Combine contracts from both relations
    const allContracts = [
      ...(user.companyContracts || []),
      ...(user.engineerContracts || []),
    ];

    // Remove sensitive fields
    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      profile: user.engineerProfile || user.companyProfile,
      assessments: user.assessments.map((a) => ({
        id: a.id,
        overallScore: a.overallScore,
        tier: a.tier,
        createdAt: a.createdAt,
      })),
      tasks: user.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        createdAt: t.createdAt,
      })),
      contracts: allContracts.map((c) => ({
        id: c.id,
        hiringMode: c.hiringMode,
        status: c.status,
        createdAt: c.createdAt,
      })),
      payments: user.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        type: p.type,
        status: p.status,
        createdAt: p.createdAt,
      })),
      wallet: user.wallet
        ? {
            balance: user.wallet.balance,
            totalEarned: user.wallet.totalEarned,
            totalWithdrawn: user.wallet.totalWithdrawn,
          }
        : null,
    };

    return exportData;
  }

  /**
   * Check if user has accepted latest privacy policy
   */
  async hasAcceptedLatestPrivacyPolicy(userId: string): Promise<boolean> {
    const latestVersion = await this.getLatestPrivacyPolicyVersion();

    const acceptance = await this.prisma.privacyPolicyAcceptance.findFirst({
      where: {
        userId,
        version: latestVersion,
      },
    });

    return !!acceptance;
  }

  /**
   * Record privacy policy acceptance
   */
  async recordPrivacyPolicyAcceptance(data: {
    userId: string;
    version: string;
    ipAddress: string;
    userAgent: string;
  }) {
    return await this.prisma.privacyPolicyAcceptance.create({
      data: {
        userId: data.userId,
        version: data.version,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        acceptedAt: new Date(),
      },
    });
  }

  /**
   * Get latest privacy policy version
   */
  private async getLatestPrivacyPolicyVersion(): Promise<string> {
    // TODO: Implement version tracking
    return "1.0.0";
  }

  /**
   * Get compliance report for user
   */
  async getComplianceReport(userId: string) {
    const consents = await this.getUserConsents(userId);
    const retentionStatus = await this.getDataRetentionStatus(userId);
    const hasAcceptedPrivacy =
      await this.hasAcceptedLatestPrivacyPolicy(userId);

    const deletionRequest = await this.prisma.accountDeletionRequest.findFirst({
      where: {
        userId,
        status: "pending",
      },
    });

    return {
      consents,
      retentionStatus,
      privacyPolicy: {
        accepted: hasAcceptedPrivacy,
        latestVersion: await this.getLatestPrivacyPolicyVersion(),
      },
      accountDeletion: deletionRequest
        ? {
            requested: true,
            scheduledFor: deletionRequest.scheduledFor,
          }
        : {
            requested: false,
          },
    };
  }
}
