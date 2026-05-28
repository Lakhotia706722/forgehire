import { FastifyInstance } from "fastify";
import { getPrismaClient } from "../config/database";
import { getRedisClient } from "../config/redis";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { successResponse } from "@neuronhire/shared";

export async function dashboardRoutes(fastify: FastifyInstance) {
  const prisma = getPrismaClient();
  // Engineer dashboard stats
  fastify.get(
    "/engineer",
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const authUser = (request as AuthenticatedRequest).user!;
      const userId = authUser.userId ?? authUser.id;

      // Get engineer profile
      const profile = await prisma.engineerProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!profile) {
        return reply.code(404).send({ error: "Engineer profile not found" });
      }

      const cacheKey = `dashboard:engineer:v2:${profile.id}`;
      const cached = await getRedisClient().get(cacheKey);
      if (cached) {
        return reply.send(successResponse(JSON.parse(cached)));
      }

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
      );

      const [
        profileData,
        activeContracts,
        pendingProposals,
        totalProposals,
        acceptedProposals,
        bountiesWon,
        recentBounties,
        marketplaceRevenueThisMonth,
        marketplaceRevenueLastMonth,
        unreadMessages,
        wallet,
        pendingPayouts,
        payoutsPendingSum,
        recentParticipations,
        recentPayments,
        scoreHistory,
      ] = await Promise.all([
        prisma.engineerProfile.findUnique({
          where: { id: profile.id },
          select: {
            fullName: true,
            neuronScore: true,
            neuronTier: true,
            completenessScore: true,
          },
        }),
        prisma.contract.count({
          where: { engineerProfileId: profile.id, status: "active" },
        }),
        prisma.taskParticipation.count({
          where: {
            engineerProfileId: profile.id,
            approved: false,
            rejected: false,
          },
        }),
        prisma.taskParticipation.count({
          where: { engineerProfileId: profile.id },
        }),
        prisma.taskParticipation.count({
          where: { engineerProfileId: profile.id, approved: true },
        }),
        prisma.taskSubmission.count({
          where: { engineerProfileId: profile.id, isWinner: true },
        }),
        prisma.task.findMany({
          where: {
            status: "open",
            minNeuronScore: {
              lte:
                (
                  await prisma.engineerProfile.findUnique({
                    where: { id: profile.id },
                    select: { neuronScore: true },
                  })
                )?.neuronScore ?? 0,
            },
          },
          orderBy: { rewardAmount: "desc" },
          take: 5,
          include: {
            companyProfile: {
              select: { companyName: true, logoUrl: true },
            },
          },
        }),
        prisma.purchase
          .aggregate({
            where: {
              product: { engineerProfileId: profile.id },
              status: "completed",
              purchasedAt: { gte: thisMonthStart },
            },
            _sum: { engineerPayout: true },
          })
          .then((r) => Number(r._sum.engineerPayout || 0)),
        prisma.purchase
          .aggregate({
            where: {
              product: { engineerProfileId: profile.id },
              status: "completed",
              purchasedAt: { gte: lastMonthStart, lte: lastMonthEnd },
            },
            _sum: { engineerPayout: true },
          })
          .then((r) => Number(r._sum.engineerPayout || 0)),
        prisma.message.count({
          where: {
            conversation: {
              OR: [{ participant1Id: userId }, { participant2Id: userId }],
            },
            senderId: { not: userId },
            readAt: null,
          },
        }),
        prisma.wallet.findUnique({
          where: { userId },
          select: { balance: true },
        }),
        prisma.payout.count({
          where: {
            userId,
            status: { in: ["pending", "processing"] },
          },
        }),
        prisma.payout
          .aggregate({
            where: {
              userId,
              status: { in: ["pending", "processing"] },
            },
            _sum: { amount: true },
          })
          .then((r) => Number(r._sum.amount || 0)),
        prisma.taskParticipation.findMany({
          where: { engineerProfileId: profile.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { task: { select: { title: true } } },
        }),
        prisma.walletTransaction.findMany({
          where: { wallet: { userId }, type: "credit" },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.neuronScoreHistory.findMany({
          where: { engineerProfileId: profile.id },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
      ]);

      const revenueTrend =
        marketplaceRevenueLastMonth > 0
          ? ((marketplaceRevenueThisMonth - marketplaceRevenueLastMonth) /
              marketplaceRevenueLastMonth) *
            100
          : 0;

      const activities: Array<{ id: string; type: string; message: string; timestamp: string }> = [];

      recentParticipations.forEach((p) => {
        const status = p.approved ? "accepted" : p.rejected ? "rejected" : "pending";
        activities.push({
          id: `proposal-${p.id}`,
          type: `proposal_${status}`,
          message: `Proposal ${status}: ${p.task.title}`,
          timestamp: p.createdAt.toISOString(),
        });
      });
      recentPayments.forEach((p) => {
        activities.push({
          id: `payment-${p.id}`,
          type: "payment_received",
          message: `Received ₹${Number(p.amount).toLocaleString("en-IN")}`,
          timestamp: p.createdAt.toISOString(),
        });
      });
      scoreHistory.forEach((s) => {
        activities.push({
          id: `score-${s.id}`,
          type: "score_updated",
          message: `NeuronScore ${s.scoreDelta > 0 ? "+" : ""}${s.scoreDelta}: ${s.reason}`,
          timestamp: s.createdAt.toISOString(),
        });
      });
      activities.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      const payload = {
        profile: {
          name: profileData?.fullName ?? "",
          photo: null,
          neuronScore: profileData?.neuronScore ?? 0,
          tier: profileData?.neuronTier ?? "conditional",
          completeness: profileData?.completenessScore ?? 0,
        },
        stats: {
          profileViews30d: 0,
          proposalsSent: totalProposals,
          acceptanceRate:
            totalProposals > 0
              ? Math.round((acceptedProposals / totalProposals) * 100)
              : 0,
          bountiesWon,
          totalEarnings:
            Number(wallet?.balance ?? 0) + Number(payoutsPendingSum || 0),
        },
        recommendedBounties: recentBounties.map((t) => ({
          id: t.id,
          title: t.title,
          rewardAmount: Number(t.rewardAmount),
          deadline: t.deadline,
          difficulty: t.difficulty,
          company: {
            name: t.companyProfile.companyName,
            logoUrl: t.companyProfile.logoUrl,
          },
          minNeuronScore: t.minNeuronScore,
          participantCount: t.participantCount,
          techRequirements: t.techRequirements,
        })),
        recentActivity: activities.slice(0, 10),
        walletBalance: Number(wallet?.balance ?? 0),
        pendingPayments: Number(payoutsPendingSum || 0),
        activeContractsCount: activeContracts,
        notifications: [
          {
            id: "unread-messages",
            type: "message",
            title: "Unread messages",
            count: unreadMessages,
          },
          {
            id: "pending-payouts",
            type: "payout",
            title: "Pending payouts",
            count: pendingPayouts,
          },
        ],
        // backward compatibility keys used by existing web hooks/components
        activeContracts: { count: activeContracts, trend: 0 },
        pendingProposals: { count: pendingProposals, trend: 0 },
        marketplaceRevenue: {
          amount: marketplaceRevenueThisMonth,
          trend: Math.round(revenueTrend),
        },
        unreadMessages: { count: unreadMessages },
      };

      await getRedisClient().setex(cacheKey, 60, JSON.stringify(payload));
      return reply.send(successResponse(payload));
    },
  );

  // Engineer recommended bounties
  fastify.get(
    "/engineer/recommended-bounties",
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const userId = (request as AuthenticatedRequest).user!.id;
      const { limit = 10 } = request.query as { limit?: number };

      const profile = await prisma.engineerProfile.findUnique({
        where: { userId },
        include: { skills: { select: { skillName: true } } },
      });

      if (!profile) {
        return reply.code(404).send({ error: "Engineer profile not found" });
      }

      const skillNames = profile.skills.map((s) => s.skillName);

      const tasks = await prisma.task.findMany({
        where: {
          status: "open",
          minNeuronScore: { lte: profile.neuronScore },
          ...(skillNames.length > 0
            ? { techRequirements: { hasSome: skillNames } }
            : {}),
        },
        orderBy: { rewardAmount: "desc" },
        take: Number(limit),
        include: {
          companyProfile: {
            select: { companyName: true, logoUrl: true, trustScore: true },
          },
        },
      });

      const result = tasks.map((t) => {
        const daysLeft = t.deadline
          ? Math.ceil(
              (t.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            )
          : null;
        const matchingSkills = t.techRequirements.filter((req) =>
          skillNames.includes(req),
        );
        const matchPercentage =
          t.techRequirements.length > 0
            ? Math.round(
                (matchingSkills.length / t.techRequirements.length) * 100,
              )
            : 0;

        return {
          id: t.id,
          title: t.title,
          type: t.type,
          category: t.category,
          rewardAmount: Number(t.rewardAmount),
          difficulty: t.difficulty,
          minNeuronScore: t.minNeuronScore,
          participantCount: t.participantCount,
          daysLeft,
          matchPercentage,
          matchingSkills,
          company: {
            name: t.companyProfile.companyName,
            logoUrl: t.companyProfile.logoUrl,
            trustScore: t.companyProfile.trustScore,
          },
        };
      });

      return reply.send(result);
    },
  );

  // Engineer recent activity feed
  fastify.get(
    "/engineer/activity",
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const userId = (request as AuthenticatedRequest).user!.id;
      const { limit = 10 } = request.query as { limit?: number };

      const profile = await prisma.engineerProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!profile) {
        return reply.code(404).send({ error: "Engineer profile not found" });
      }

      const [proposals, payments, contracts, scoreHistory] = await Promise.all([
        prisma.taskParticipation.findMany({
          where: { engineerProfileId: profile.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { task: { select: { title: true } } },
        }),
        prisma.walletTransaction.findMany({
          where: { wallet: { userId }, type: "credit" },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.contract.findMany({
          where: { engineerProfileId: profile.id },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: { id: true, title: true, status: true, createdAt: true },
        }),
        prisma.neuronScoreHistory.findMany({
          where: { engineerProfileId: profile.id },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
      ]);

      const activities: any[] = [];

      proposals.forEach((p) => {
        const status = p.approved
          ? "accepted"
          : p.rejected
            ? "rejected"
            : "pending";
        activities.push({
          id: `proposal-${p.id}`,
          type: `proposal_${status}`,
          message: `Proposal ${status}: ${p.task.title}`,
          timestamp: p.createdAt,
        });
      });

      payments.forEach((p) => {
        activities.push({
          id: `payment-${p.id}`,
          type: "payment_received",
          message: `Received ₹${Number(p.amount).toLocaleString("en-IN")}`,
          timestamp: p.createdAt,
        });
      });

      contracts.forEach((c) => {
        activities.push({
          id: `contract-${c.id}`,
          type: "contract_started",
          message: `Contract started: ${c.title}`,
          timestamp: c.createdAt,
        });
      });

      scoreHistory.forEach((s) => {
        activities.push({
          id: `score-${s.id}`,
          type: "score_updated",
          message: `NeuronScore ${s.scoreDelta > 0 ? "+" : ""}${s.scoreDelta}: ${s.reason}`,
          timestamp: s.createdAt,
        });
      });

      activities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      const result = activities.slice(0, Number(limit)).map((a) => ({
        ...a,
        timestamp: getRelativeTime(a.timestamp),
      }));

      return reply.send(result);
    },
  );

  // Company dashboard stats
  fastify.get(
    "/company",
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const userId = (request as AuthenticatedRequest).user!.id;

      const profile = await prisma.companyProfile.findUnique({
        where: { userId },
        select: { id: true, companyName: true, logoUrl: true, trustScore: true },
      });

      if (!profile) {
        return reply.code(404).send({ error: "Company profile not found" });
      }

      const cacheKey = `dashboard:company:v2:${profile.id}`;
      const cached = await getRedisClient().get(cacheKey);
      if (cached) {
        return reply.send(successResponse(JSON.parse(cached)));
      }

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        activeTasksPosted,
        totalEngineersHired,
        totalSpendThisMonth,
        openDisputes,
        pendingSubmissions,
        activeContracts,
        wallet,
        recommendedEngineers,
        recentTasks,
      ] = await Promise.all([
        prisma.task.count({
          where: {
            companyProfileId: profile.id,
            status: { in: ["open", "in_progress"] },
          },
        }),
        prisma.contract.count({
          where: { companyProfileId: profile.id, status: "completed" },
        }),
        prisma.payment
          .aggregate({
            where: {
              userId,
              status: "completed",
              createdAt: { gte: thisMonthStart },
            },
            _sum: { amount: true },
          })
          .then((r) => Number(r._sum.amount || 0)),
        prisma.contractDispute.count({
          where: {
            contract: { companyProfileId: profile.id },
            status: { not: "resolved" },
          },
        }),
        prisma.taskSubmission.count({
          where: { task: { companyProfileId: profile.id }, status: "pending" },
        }),
        prisma.contract.findMany({
          where: { companyProfileId: profile.id, status: { in: ["active", "draft"] } },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        }),
        prisma.wallet.findUnique({
          where: { userId },
          select: { balance: true },
        }),
        prisma.engineerProfile.findMany({
          where: { neuronScore: { gte: 400 } },
          orderBy: { neuronScore: "desc" },
          take: 5,
          select: {
            id: true,
            fullName: true,
            headline: true,
            neuronScore: true,
            neuronTier: true,
            hourlyRate: true,
            availabilityStatus: true,
          },
        }),
        prisma.task.findMany({
          where: { companyProfileId: profile.id },
          orderBy: { updatedAt: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
          },
        }),
      ]);

      const payload = {
        profile: {
          name: profile.companyName,
          logo: profile.logoUrl,
          trustScore: profile.trustScore,
          verificationStatus: profile.trustScore >= 60 ? "verified" : "basic",
        },
        stats: {
          activeTasksCount: activeTasksPosted,
          totalSpend: totalSpendThisMonth,
          engineersHired: totalEngineersHired,
          avgRating: 0,
          pendingSubmissions,
        },
        pendingSubmissions: [],
        recommendedEngineers: recommendedEngineers.map((e) => ({
          id: e.id,
          fullName: e.fullName,
          headline: e.headline,
          neuronScore: e.neuronScore,
          neuronTier: e.neuronTier,
          hourlyRate: Number(e.hourlyRate ?? 0),
          availabilityStatus: e.availabilityStatus,
        })),
        recentActivity: recentTasks.map((t) => ({
          id: t.id,
          type: "task_update",
          message: `${t.title} is ${t.status}`,
          timestamp: t.updatedAt.toISOString(),
        })),
        activeContracts: activeContracts.map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status,
          totalAmount: Number(c.totalAmount ?? 0),
          createdAt: c.createdAt.toISOString(),
        })),
        walletBalance: Number(wallet?.balance ?? 0),
        // backward compatibility for existing web UI
        activeTasksPosted,
        totalEngineersHired,
        totalSpendThisMonth,
        openDisputes,
      };
      await getRedisClient().setex(cacheKey, 60, JSON.stringify(payload));
      return reply.send(successResponse(payload));
    },
  );

  // Company pending submissions
  fastify.get(
    "/company/pending-submissions",
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const userId = (request as AuthenticatedRequest).user!.id;
      const { limit = 10 } = request.query as { limit?: number };

      const profile = await prisma.companyProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!profile) {
        return reply.code(404).send({ error: "Company profile not found" });
      }

      const submissions = await prisma.taskSubmission.findMany({
        where: { task: { companyProfileId: profile.id }, status: "pending" },
        orderBy: { submittedAt: "desc" },
        take: Number(limit),
        include: {
          task: { select: { title: true } },
          engineerProfile: { select: { fullName: true, neuronScore: true } },
        },
      });

      return reply.send(
        successResponse(
          submissions.map((s) => ({
          id: s.id,
          taskId: s.taskId,
          taskTitle: s.task.title,
          engineerName: s.engineerProfile.fullName,
          engineerScore: s.engineerProfile.neuronScore,
          submittedAt: s.submittedAt,
          demoUrl: s.demoUrl,
          githubUrl: s.githubUrl,
          })),
        ),
      );
    },
  );
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
