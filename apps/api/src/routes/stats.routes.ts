import { FastifyInstance } from "fastify";
import { getPrismaClient } from "../config/database";
import { getRedisClient } from "../config/redis";
import {
  authenticate,
  requireAdmin,
  AuthenticatedRequest,
} from "../middleware/auth";
import { withDbFallback } from "../utils/with-db-fallback";

const EMPTY_PLATFORM_STATS = {
  totalEngineers: 0,
  verifiedEngineers: 0,
  activeEngineers: 0,
  totalCompanies: 0,
  activeContracts: 0,
  completedContracts: 0,
  totalBounties: 0,
  activeBounties: 0,
  totalPaidOut: 0,
};

export async function statsRoutes(fastify: FastifyInstance) {
  const prisma = getPrismaClient();
  // Public platform stats (for landing page)
  fastify.get("/platform", async (_request, reply) => {
    const cacheKey = "stats:platform";
    const cached = await getRedisClient().get(cacheKey);
    if (cached) return reply.send(JSON.parse(cached));

    const stats = await withDbFallback(async () => {
      const [
        totalEngineers,
        verifiedEngineers,
        activeEngineers,
        totalCompanies,
        activeContracts,
        completedContracts,
        totalBounties,
        activeBounties,
        contractPayments,
        bountyPayments,
      ] = await Promise.all([
        prisma.engineerProfile.count(),
        prisma.engineerProfile.count({
          where: { neuronTier: { not: "conditional" } },
        }),
        prisma.engineerProfile.count({
          where: { availabilityStatus: "available_now" },
        }),
        prisma.companyProfile.count(),
        prisma.contract.count({ where: { status: "active" } }),
        prisma.contract.count({ where: { status: "completed" } }),
        prisma.task.count(),
        prisma.task.count({ where: { status: "open" } }),
        prisma.payment.aggregate({
          where: { type: "milestone_release", status: "completed" },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: { type: "payout", status: "completed" },
          _sum: { amount: true },
        }),
      ]);

      const totalPaidOut =
        Number(contractPayments._sum.amount || 0) +
        Number(bountyPayments._sum.amount || 0);

      return {
        totalEngineers,
        verifiedEngineers,
        activeEngineers,
        totalCompanies,
        activeContracts,
        completedContracts,
        totalBounties,
        activeBounties,
        totalPaidOut,
      };
    }, EMPTY_PLATFORM_STATS, "stats/platform");

    await getRedisClient().setex(cacheKey, 300, JSON.stringify(stats));
    return reply.send(stats);
  });

  // Admin dashboard stats
  fastify.get(
    "/admin",
    {
      preHandler: [authenticate, requireAdmin],
    },
    async (_request, reply) => {
      const cacheKey = "stats:admin";
      const cached = await getRedisClient().get(cacheKey);
      if (cached) return reply.send(JSON.parse(cached));

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalEngineers,
        totalCompanies,
        activeContracts,
        gmvToday,
        gmvThisWeek,
        gmvThisMonth,
        assessmentsPassed,
        assessmentsTotal,
        platformFeeToday,
        platformFeeThisWeek,
        platformFeeThisMonth,
        pendingDisputes,
        flaggedAssessments,
        moderationQueue,
      ] = await Promise.all([
        prisma.user.count({ where: { role: "engineer" } }),
        prisma.user.count({ where: { role: "company" } }),
        prisma.contract.count({ where: { status: "active" } }),
        prisma.payment
          .aggregate({
            where: { status: "completed", createdAt: { gte: today } },
            _sum: { amount: true },
          })
          .then((r) => Number(r._sum.amount || 0)),
        prisma.payment
          .aggregate({
            where: { status: "completed", createdAt: { gte: thisWeekStart } },
            _sum: { amount: true },
          })
          .then((r) => Number(r._sum.amount || 0)),
        prisma.payment
          .aggregate({
            where: { status: "completed", createdAt: { gte: thisMonthStart } },
            _sum: { amount: true },
          })
          .then((r) => Number(r._sum.amount || 0)),
        prisma.assessment.count({
          where: { tier: { in: ["elite", "professional", "verified"] } },
        }),
        prisma.assessment.count({ where: { status: "evaluated" } }),
        prisma.payment
          .aggregate({
            where: { status: "completed", createdAt: { gte: today } },
            _sum: { platformFee: true },
          })
          .then((r) => Number(r._sum.platformFee || 0)),
        prisma.payment
          .aggregate({
            where: { status: "completed", createdAt: { gte: thisWeekStart } },
            _sum: { platformFee: true },
          })
          .then((r) => Number(r._sum.platformFee || 0)),
        prisma.payment
          .aggregate({
            where: { status: "completed", createdAt: { gte: thisMonthStart } },
            _sum: { platformFee: true },
          })
          .then((r) => Number(r._sum.platformFee || 0)),
        prisma.contractDispute.count({
          where: { status: { not: "resolved" } },
        }),
        prisma.assessment.count({
          where: { OR: [{ flagged: true }, { plagiarismFlagged: true }] },
        }),
        prisma.product.count({ where: { status: "pending_moderation" } }),
      ]);

      const stats = {
        totalEngineers,
        totalCompanies,
        activeContracts,
        gmvToday,
        gmvThisWeek,
        gmvThisMonth,
        assessmentPassRate:
          assessmentsTotal > 0
            ? (assessmentsPassed / assessmentsTotal) * 100
            : 0,
        platformFeeToday,
        platformFeeThisWeek,
        platformFeeThisMonth,
        pendingDisputes,
        flaggedAssessments,
        moderationQueue,
      };

      await getRedisClient().setex(cacheKey, 60, JSON.stringify(stats));
      return reply.send(stats);
    },
  );

  // Revenue chart data (admin only)
  fastify.get(
    "/admin/revenue",
    {
      preHandler: [authenticate, requireAdmin],
    },
    async (request, reply) => {
      const { months = 6 } = request.query as { months?: number };
      const cacheKey = `stats:admin:revenue:${months}`;
      const cached = await getRedisClient().get(cacheKey);
      if (cached) return reply.send(JSON.parse(cached));

      const now = new Date();
      const startDate = new Date(now);
      startDate.setMonth(now.getMonth() - Number(months));

      const payments = await prisma.payment.findMany({
        where: { status: "completed", createdAt: { gte: startDate } },
        select: { createdAt: true, amount: true, type: true },
      });

      const revenueByMonth: Record<
        string,
        {
          contracts: number;
          bounties: number;
          marketplace: number;
          total: number;
        }
      > = {};

      payments.forEach((p) => {
        const d = p.createdAt;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!revenueByMonth[key])
          revenueByMonth[key] = {
            contracts: 0,
            bounties: 0,
            marketplace: 0,
            total: 0,
          };
        const amount = Number(p.amount);
        revenueByMonth[key].total += amount;
        if (p.type === "milestone_release")
          revenueByMonth[key].contracts += amount;
        else if (p.type === "payout") revenueByMonth[key].bounties += amount;
        else if (p.type === "escrow_deposit")
          revenueByMonth[key].marketplace += amount;
      });

      const result = Object.entries(revenueByMonth)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      await getRedisClient().setex(cacheKey, 3600, JSON.stringify(result));
      return reply.send(result);
    },
  );

  // Real-time activity feed (admin only)
  fastify.get(
    "/admin/activity",
    {
      preHandler: [authenticate, requireAdmin],
    },
    async (request, reply) => {
      const { limit = 20 } = request.query as { limit?: number };

      const [recentSignups, recentAssessments, recentPayments, recentDisputes] =
        await Promise.all([
          prisma.user.findMany({
            where: { role: { in: ["engineer", "company"] } },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, email: true, role: true, createdAt: true },
          }),
          prisma.assessment.findMany({
            where: { status: "evaluated" },
            orderBy: { evaluatedAt: "desc" },
            take: 5,
            include: {
              user: { select: { email: true } },
              engineerProfile: { select: { fullName: true } },
            },
          }),
          prisma.payment.findMany({
            where: { status: "completed" },
            orderBy: { completedAt: "desc" },
            take: 5,
            select: { id: true, amount: true, type: true, completedAt: true },
          }),
          prisma.contractDispute.findMany({
            orderBy: { raisedAt: "desc" },
            take: 5,
            select: { id: true, reason: true, raisedAt: true },
          }),
        ]);

      const activities: any[] = [];

      recentSignups.forEach((u) =>
        activities.push({
          id: `signup-${u.id}`,
          type: "signup",
          message: `New ${u.role} signup: ${u.email}`,
          timestamp: u.createdAt,
        }),
      );

      recentAssessments.forEach((a) =>
        activities.push({
          id: `assessment-${a.id}`,
          type: "assessment_pass",
          message: `Assessment evaluated: ${a.engineerProfile.fullName} (Score: ${a.overallScore ?? "—"})`,
          timestamp: a.evaluatedAt ?? a.createdAt,
        }),
      );

      recentPayments.forEach((p) =>
        activities.push({
          id: `payment-${p.id}`,
          type: "payment_processed",
          message: `Payment processed: ₹${Number(p.amount).toLocaleString("en-IN")}`,
          timestamp: p.completedAt ?? new Date(),
        }),
      );

      recentDisputes.forEach((d) =>
        activities.push({
          id: `dispute-${d.id}`,
          type: "dispute_raised",
          message: `Dispute raised: ${d.reason.substring(0, 60)}`,
          timestamp: d.raisedAt,
        }),
      );

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
