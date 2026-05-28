import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AnalyticsService } from "../services/analytics.service";
import { authenticate, requireAdmin } from "../middleware/auth";
import { successResponse } from "@neuronhire/shared";
import { getPrismaClient } from "../config/database";

export async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  const analyticsService = new AnalyticsService();
  const prisma = getPrismaClient();

  // Get engineer analytics (own)
  fastify.get(
    "/analytics/engineer/me",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { startDate, endDate } = request.query as any;

      const profile = await prisma.engineerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        return reply
          .code(404)
          .send({ success: false, error: "Engineer profile not found" });
      }

      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const analytics = await analyticsService.getEngineerAnalytics(
        profile.id,
        start,
        end,
      );
      return successResponse(analytics);
    },
  );

  // Get engineer analytics by ID (public/admin)
  fastify.get(
    "/analytics/engineer/:id",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { id } = request.params as any;
      const { startDate, endDate } = request.query as any;

      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const analytics = await analyticsService.getEngineerAnalytics(
        id,
        start,
        end,
      );
      return successResponse(analytics);
    },
  );

  // Get company analytics (own)
  fastify.get(
    "/analytics/company/me",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { startDate, endDate } = request.query as any;

      const profile = await prisma.companyProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        return reply
          .code(404)
          .send({ success: false, error: "Company profile not found" });
      }

      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const analytics = await analyticsService.getCompanyAnalytics(
        profile.id,
        start,
        end,
      );
      return successResponse(analytics);
    },
  );

  // Get company analytics by ID
  fastify.get(
    "/analytics/company/:id",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { id } = request.params as any;
      const { startDate, endDate } = request.query as any;

      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const analytics = await analyticsService.getCompanyAnalytics(
        id,
        start,
        end,
      );
      return successResponse(analytics);
    },
  );

  // Platform analytics (admin only)
  fastify.get(
    "/analytics/platform",
    { preHandler: [authenticate, requireAdmin] },
    async (_request: FastifyRequest, _reply: FastifyReply) => {
      const [
        totalEngineers,
        totalCompanies,
        totalTasks,
        totalProducts,
        totalContracts,
      ] = await Promise.all([
        prisma.engineerProfile.count(),
        prisma.companyProfile.count(),
        prisma.task.count(),
        prisma.product.count({ where: { status: "published" } }),
        prisma.contract.count(),
      ]);

      return successResponse({
        totalEngineers,
        totalCompanies,
        totalTasks,
        totalProducts,
        totalContracts,
      });
    },
  );

  // Market rates
  fastify.get(
    "/analytics/market-rates",
    async (_request: FastifyRequest, _reply: FastifyReply) => {
      const rateByTier = await prisma.engineerProfile.groupBy({
        by: ["neuronTier"],
        _avg: { hourlyRate: true },
        _min: { hourlyRate: true },
        _max: { hourlyRate: true },
        where: {
          hourlyRate: { not: null },
          completenessScore: { gte: 70 },
        },
      });

      const profiles = await prisma.engineerProfile.findMany({
        where: {
          hourlyRate: { not: null },
          completenessScore: { gte: 70 },
        },
        select: {
          hourlyRate: true,
          skills: { select: { skillName: true } },
        },
      });

      const ratesBySkill: Record<string, number[]> = {};
      for (const profile of profiles) {
        const rate = Number(profile.hourlyRate);
        for (const skill of profile.skills) {
          const name = skill.skillName;
          if (!ratesBySkill[name]) ratesBySkill[name] = [];
          ratesBySkill[name].push(rate);
        }
      }

      const percentile = (sorted: number[], p: number) => {
        if (sorted.length === 0) return 0;
        const idx = Math.min(
          sorted.length - 1,
          Math.floor(sorted.length * p),
        );
        return sorted[idx];
      };

      const ratesBySkillList = Object.entries(ratesBySkill)
        .filter(([, rates]) => rates.length >= 3)
        .map(([skill, rates]) => {
          const sorted = [...rates].sort((a, b) => a - b);
          return {
            skill,
            p10: percentile(sorted, 0.1),
            p25: percentile(sorted, 0.25),
            median: percentile(sorted, 0.5),
            p75: percentile(sorted, 0.75),
            p90: percentile(sorted, 0.9),
            sampleSize: sorted.length,
            tierBreakdown: rateByTier.map((tier) => ({
              tier: tier.neuronTier,
              avgRate: Number(tier._avg.hourlyRate ?? 0),
            })),
            relatedSkills: Object.keys(ratesBySkill)
              .filter((s) => s !== skill)
              .slice(0, 4),
          };
        })
        .sort((a, b) => b.sampleSize - a.sampleSize);

      return successResponse({
        byTier: rateByTier,
        bySkill: ratesBySkillList,
      });
    },
  );
}
