import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticate, requireAdmin } from "../middleware/auth";
import { successResponse } from "@neuronhire/shared";
import { getPrismaClient } from "../config/database";
import { NeuronScoreService } from "../services/neuron-score.service";
import { z } from "zod";

const engineerStatusSchema = z.object({
  status: z.enum(["active", "suspended", "banned"]),
  reason: z.string().optional(),
});

const scoreOverrideSchema = z.object({
  score: z.number().min(0).max(1000),
  reason: z.string().min(1),
});

const assessmentDecisionSchema = z.object({
  decision: z.enum(["approve", "reject", "flag"]),
  notes: z.string().optional(),
});

const disputeResolveSchema = z.object({
  resolution: z.string().min(1),
  outcome: z.enum(["refund_buyer", "pay_seller", "split", "no_action"]),
  refundAmount: z.number().optional(),
});

const moderationDecisionSchema = z.object({
  decision: z.enum(["approve", "reject", "request_changes"]),
  notes: z.string().optional(),
});

export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  const prisma = getPrismaClient();
  const neuronScoreService = new NeuronScoreService();

  // ── Platform Stats ──────────────────────────────────────────
  fastify.get(
    "/admin/stats",
    { preHandler: [authenticate, requireAdmin] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const [
        totalEngineers,
        totalCompanies,
        activeContracts,
        openTasks,
        publishedProducts,
        openDisputes,
        pendingModerations,
        flaggedAssessments,
      ] = await Promise.all([
        prisma.engineerProfile.count(),
        prisma.companyProfile.count(),
        prisma.contract.count({ where: { status: "active" } }),
        prisma.task.count({ where: { status: "open" } }),
        prisma.product.count({ where: { status: "published" } }),
        prisma.dispute.count({ where: { status: "open" } }),
        prisma.product.count({ where: { status: "pending_moderation" } }),
        prisma.assessment.count({
          where: { flagged: true, status: "evaluated" },
        }),
      ]);

      return successResponse({
        totalEngineers,
        totalCompanies,
        activeContracts,
        openTasks,
        publishedProducts,
        openDisputes,
        pendingModerations,
        flaggedAssessments,
      });
    },
  );

  // ── Engineers ───────────────────────────────────────────────
  fastify.get(
    "/admin/engineers",
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const {
        page = "1",
        limit = "20",
        search,
        tier,
        status,
      } = request.query as any;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where: any = {};
      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: "insensitive" } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ];
      }
      if (tier) where.neuronTier = tier;

      const [engineers, total] = await Promise.all([
        prisma.engineerProfile.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            user: { select: { id: true, email: true, createdAt: true } },
            _count: { select: { assessments: true, products: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.engineerProfile.count({ where }),
      ]);

      return successResponse({
        engineers,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    },
  );

  fastify.put(
    "/admin/engineers/:id/status",
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as any;
      const body = engineerStatusSchema.parse(request.body);

      // Update user status (using a metadata field or separate status)
      const profile = await prisma.engineerProfile.findUnique({
        where: { id },
      });
      if (!profile)
        return reply
          .code(404)
          .send({ success: false, error: "Engineer not found" });

      // Store status in profile (extend schema if needed; for now update availability)
      const updated = await prisma.engineerProfile.update({
        where: { id },
        data: {
          availabilityStatus:
            body.status === "suspended" ? "not_available" : "available_now",
        },
      });

      return successResponse(updated);
    },
  );

  fastify.put(
    "/admin/engineers/:id/score-override",
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as any;
      const body = scoreOverrideSchema.parse(request.body);

      const tier = neuronScoreService.determineTier(body.score);

      const updated = await prisma.engineerProfile.update({
        where: { id },
        data: { neuronScore: body.score, neuronTier: tier },
      });

      // Log to history
      await prisma.neuronScoreHistory.create({
        data: {
          engineerProfileId: id,
          previousScore: updated.neuronScore,
          newScore: body.score,
          scoreDelta: body.score - updated.neuronScore,
          reason: body.reason,
          triggeredBy: "admin",
        },
      });

      return successResponse(updated);
    },
  );

  // ── Assessments ─────────────────────────────────────────────
  fastify.get(
    "/admin/assessments/flagged",
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { page = "1", limit = "20" } = request.query as any;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [assessments, total] = await Promise.all([
        prisma.assessment.findMany({
          where: { OR: [{ flagged: true }, { plagiarismFlagged: true }] },
          skip,
          take: parseInt(limit),
          include: {
            engineerProfile: { select: { fullName: true, neuronScore: true } },
            user: { select: { email: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.assessment.count({
          where: { OR: [{ flagged: true }, { plagiarismFlagged: true }] },
        }),
      ]);

      return successResponse({ assessments, total });
    },
  );

  fastify.put(
    "/admin/assessments/:id/decision",
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as any;
      const body = assessmentDecisionSchema.parse(request.body);

      const updated = await prisma.assessment.update({
        where: { id },
        data: {
          flagged: body.decision === "flag",
          proctoringViolation: body.decision === "reject",
        },
      });

      return successResponse(updated);
    },
  );

  // ── Disputes ────────────────────────────────────────────────
  fastify.get(
    "/admin/disputes",
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { page = "1", limit = "20", status } = request.query as any;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where: any = {};
      if (status) where.status = status;

      const [disputes, total] = await Promise.all([
        prisma.dispute.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            purchase: {
              include: {
                product: { select: { name: true } },
                buyer: { select: { email: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.dispute.count({ where }),
      ]);

      return successResponse({ disputes, total });
    },
  );

  fastify.get(
    "/admin/disputes/:id",
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: {
          purchase: {
            include: {
              product: { select: { name: true, id: true } },
              buyer: {
                select: {
                  email: true,
                  engineerProfile: { select: { fullName: true } },
                },
              },
            },
          },
        },
      });

      if (!dispute) {
        return reply
          .code(404)
          .send({ success: false, error: "Dispute not found" });
      }

      const seller = await prisma.user.findUnique({
        where: { id: dispute.sellerId },
        include: { engineerProfile: { select: { fullName: true } } },
      });

      const buyerName =
        dispute.purchase.buyer.engineerProfile?.fullName ??
        dispute.purchase.buyer.email ??
        "Buyer";
      const sellerName = seller?.engineerProfile?.fullName ?? "Seller";

      return successResponse({
        id: dispute.id,
        productName: dispute.purchase.product.name,
        productId: dispute.purchase.product.id,
        buyerName,
        sellerName,
        amount: Number(dispute.purchase.priceINR),
        reason: dispute.reason,
        status: dispute.status,
        createdAt: dispute.createdAt,
        resolution: dispute.resolution,
      });
    },
  );

  fastify.get(
    "/admin/companies/:id",
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const company = await prisma.companyProfile.findUnique({
        where: { id },
        include: {
          user: { select: { email: true } },
          _count: { select: { tasks: true, contracts: true } },
        },
      });

      if (!company) {
        return reply
          .code(404)
          .send({ success: false, error: "Company not found" });
      }

      const totalSpend = await prisma.contract.aggregate({
        where: { companyProfileId: id, status: "completed" },
        _sum: { totalAmount: true },
      });

      return successResponse({
        id: company.id,
        companyName: company.companyName,
        email: company.user.email,
        industry: company.industry,
        size: company.size,
        location: company.location,
        websiteVerified: company.websiteVerified,
        gstVerified: company.gstVerified,
        trustScore: company.trustScore,
        taskCount: company._count.tasks,
        contractCount: company._count.contracts,
        totalSpend: Number(totalSpend._sum.totalAmount ?? 0),
      });
    },
  );

  fastify.put(
    "/admin/disputes/:id/resolve",
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params as any;
      const body = disputeResolveSchema.parse(request.body);

      const statusMap: Record<string, string> = {
        refund_buyer: "resolved_buyer",
        pay_seller: "resolved_seller",
        split: "resolved_buyer",
        no_action: "closed",
      };

      const updated = await prisma.dispute.update({
        where: { id },
        data: {
          status: statusMap[body.outcome] as any,
          resolution: body.resolution,
          resolvedBy: user.id,
          resolvedAt: new Date(),
          refundAmount: body.refundAmount,
        },
      });

      return successResponse(updated);
    },
  );

  // ── Engineer Detail ─────────────────────────────────────────
  fastify.get(
    "/admin/engineers/:id",
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as any;
      const profile = await prisma.engineerProfile.findUnique({
        where: { id },
        include: {
          user: { select: { email: true, createdAt: true } },
          skills: { select: { skillName: true } },
          _count: {
            select: { assessments: true, contracts: true, products: true },
          },
        },
      });
      if (!profile)
        return reply
          .code(404)
          .send({ success: false, error: "Engineer not found" });

      const flaggedAssessment = await prisma.assessment.findFirst({
        where: { engineerProfileId: id, flagged: true },
      });

      return successResponse({
        id: profile.id,
        userId: profile.userId,
        fullName: profile.fullName,
        email: profile.user.email,
        neuronScore: profile.neuronScore,
        neuronTier: profile.neuronTier,
        completenessScore: profile.completenessScore,
        availabilityStatus: profile.availabilityStatus,
        location: profile.location,
        hourlyRate: profile.hourlyRate ? Number(profile.hourlyRate) : null,
        yearsOfExperience: profile.yearsOfExperience,
        kycVerified: profile.kycVerified,
        createdAt: profile.user.createdAt,
        assessmentCount: profile._count.assessments,
        contractCount: profile._count.contracts,
        productCount: profile._count.products,
        skills: profile.skills.map((s) => s.skillName),
        flagged: !!flaggedAssessment,
      });
    },
  );

  // ── Engineer Suspend ─────────────────────────────────────────
  fastify.post(
    "/admin/engineers/:id/suspend",
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as any;
      const updated = await prisma.engineerProfile.update({
        where: { id },
        data: { availabilityStatus: "not_available" },
      });
      return successResponse(updated);
    },
  );

  // ── Assessment Detail ────────────────────────────────────────
  fastify.get(
    "/admin/assessments/:id",
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as any;
      const assessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
          engineerProfile: { select: { fullName: true } },
          user: { select: { email: true } },
        },
      });
      if (!assessment)
        return reply
          .code(404)
          .send({ success: false, error: "Assessment not found" });

      return successResponse({
        id: assessment.id,
        engineerName: assessment.engineerProfile.fullName,
        email: assessment.user.email,
        overallScore: assessment.overallScore,
        tier: assessment.tier,
        status: assessment.status,
        flagged: assessment.flagged,
        plagiarismFlagged: assessment.plagiarismFlagged,
        tabSwitches: assessment.tabSwitches,
        focusLosses: assessment.focusLosses,
        pasteAttempts: assessment.pasteAttempts,
        mcqScore: assessment.mcqScore,
        codingScore: assessment.codingScore,
        caseScore: assessment.caseScore,
        dimensions: {
          modelKnowledge: assessment.modelKnowledge,
          engineeringDepth: assessment.engineeringDepth,
          systemDesign: assessment.systemDesign,
          codingQuality: assessment.codingQuality,
          practicalApp: assessment.practicalApp,
          communication: assessment.communication,
        },
        evaluatedAt: assessment.evaluatedAt,
      });
    },
  );

  // ── Product Detail (for moderation) ─────────────────────────
  fastify.get(
    "/admin/products/:id",
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as any;
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          engineerProfile: { select: { fullName: true, id: true } },
        },
      });
      if (!product)
        return reply
          .code(404)
          .send({ success: false, error: "Product not found" });

      return successResponse({
        id: product.id,
        name: product.name,
        tagline: product.tagline,
        category: product.category,
        status: product.status,
        priceINR: product.priceINR ? Number(product.priceINR) : 0,
        engineerName: product.engineerProfile.fullName,
        engineerProfileId: product.engineerProfile.id,
        description: product.description,
        techStack: product.techStack,
        demoUrl: product.demoUrl,
        submittedAt: product.createdAt,
        moderationNotes: product.moderationNotes,
      });
    },
  );

  // ── Product Moderation Decision ──────────────────────────────
  fastify.post(
    "/admin/products/:id/decision",
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as any;
      const body = moderationDecisionSchema.parse(request.body);

      const statusMap: Record<string, string> = {
        approve: "published",
        reject: "suspended",
        request_changes: "draft",
      };

      const updated = await prisma.product.update({
        where: { id },
        data: {
          status: statusMap[body.decision] as any,
          moderationNotes: body.notes,
          moderatedAt: new Date(),
          publishedAt: body.decision === "approve" ? new Date() : undefined,
        },
      });

      return successResponse(updated);
    },
  );

  // ── Moderation ──────────────────────────────────────────────
  fastify.get(
    "/admin/moderation/queue",
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { page = "1", limit = "20" } = request.query as any;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: { status: "pending_moderation" },
          skip,
          take: parseInt(limit),
          include: {
            engineerProfile: { select: { fullName: true } },
            user: { select: { email: true } },
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.product.count({ where: { status: "pending_moderation" } }),
      ]);

      return successResponse({ products, total });
    },
  );

  fastify.put(
    "/admin/moderation/:id/decision",
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as any;
      const body = moderationDecisionSchema.parse(request.body);

      const statusMap: Record<string, string> = {
        approve: "published",
        reject: "suspended",
        request_changes: "draft",
      };

      const updated = await prisma.product.update({
        where: { id },
        data: {
          status: statusMap[body.decision] as any,
          moderationNotes: body.notes,
          moderatedAt: new Date(),
          publishedAt: body.decision === "approve" ? new Date() : undefined,
        },
      });

      return successResponse(updated);
    },
  );
}
