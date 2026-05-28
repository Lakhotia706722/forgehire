import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AssessmentService } from "../services/assessment.service";
import { CodeEvaluatorService } from "../services/code-evaluator.service";
import { authenticate, requireEngineer } from "../middleware/auth";
import { successResponse } from "@neuronhire/shared";
import { z } from "zod";
import { getPrismaClient } from "../config/database";

const submitSchema = z.object({
  mcqResponses: z.array(z.any()),
  codingSubmissions: z.array(z.any()),
  caseResponse: z.string(),
});

const proctoringEventSchema = z.object({
  type: z.enum([
    "tab_switch",
    "fullscreen_exit",
    "paste_attempt",
    "copy_attempt",
    "inactivity_warning",
    "inactivity_flag",
    "window_blur",
    "suspicious_keystroke",
  ]),
  timestamp: z.string(),
  count: z.number().int().nonnegative(),
  details: z.string().optional(),
});

const runCodeSchema = z.object({
  code: z.string().min(1),
  language: z.literal("python"),
  testCases: z.array(
    z.object({
      input: z.any(),
      expectedOutput: z.any(),
      hidden: z.boolean().optional().default(false),
    }),
  ),
});

function parseJsonLike(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function assessmentRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const assessmentService = new AssessmentService();
  const evaluator = new CodeEvaluatorService();
  const prisma = getPrismaClient();

  // Generate new assessment
  fastify.post(
    "/assessment/generate",
    { preHandler: [authenticate, requireEngineer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const userId = user.userId ?? user.id;

      const profile = await prisma.engineerProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        return reply
          .code(404)
          .send({ success: false, error: "Engineer profile not found" });
      }

      const result = await assessmentService.generateAssessment(
        profile.id,
        userId,
      );
      return reply.code(201).send(successResponse(result));
    },
  );

  // Start assessment session and fingerprint the attempt
  fastify.post(
    "/assessment/:id/start",
    { preHandler: [authenticate, requireEngineer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const user = (request as any).user;
      const userId = user.userId ?? user.id;
      const userAgent = request.headers["user-agent"] ?? "";
      const acceptLanguage = request.headers["accept-language"] ?? "";
      const fingerprint = `${userAgent}|${acceptLanguage}`;

      const recent = await prisma.assessment.findFirst({
        where: {
          userId,
          deviceFingerprint: fingerprint,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (recent && recent.id !== id) {
        return reply
          .code(409)
          .send({ success: false, error: "Assessment attempt blocked for this device within 30 days" });
      }

      const assessment = await prisma.assessment.findUnique({ where: { id } });
      if (!assessment) {
        return reply.code(404).send({ success: false, error: "Assessment not found" });
      }

      await prisma.assessment.update({
        where: { id },
        data: {
          status: "in_progress",
          startedAt: assessment.startedAt ?? new Date(),
          ipAddress: request.ip,
          deviceFingerprint: fingerprint,
        },
      });

      return successResponse({ started: true, assessmentId: id });
    },
  );

  // Get assessment by ID
  fastify.get(
    "/assessment/:id",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as any;
      const assessment = await assessmentService.getAssessment(id);

      if (!assessment) {
        return reply
          .code(404)
          .send({ success: false, error: "Assessment not found" });
      }

      return successResponse(assessment);
    },
  );

  // Isolated code execution endpoint for coding section
  fastify.post(
    "/assessment/run-code",
    { preHandler: [authenticate, requireEngineer] },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const body = runCodeSchema.parse(request.body);
      const result = await evaluator.evaluateCode(
        body.code,
        body.testCases.map((t) => ({
          input: t.input,
          expectedOutput: t.expectedOutput,
          hidden: t.hidden ?? false,
        })),
      );

      const passed = result.testResults.filter((t) => t.passed);
      const failed = result.testResults.filter((t) => !t.passed);
      return successResponse({
        stdout: passed.length ? JSON.stringify(passed) : "",
        stderr: failed.length
          ? failed.map((f) => f.error ?? "Test failed").join("\n")
          : "",
        passed,
        failed,
        executionTime: result.executionTime,
      });
    },
  );

  // Submit assessment
  fastify.post(
    "/assessment/:id/submit",
    { preHandler: [authenticate, requireEngineer] },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const { id } = request.params as any;
      const body = submitSchema.parse(request.body);

      await assessmentService.submitAssessment(id, body);
      return successResponse({
        message: "Assessment submitted successfully. Evaluation in progress.",
      });
    },
  );

  // Get assessment report
  fastify.get(
    "/assessment/:id/report",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as any;
      const assessment = await assessmentService.getAssessment(id);

      if (!assessment) {
        return reply
          .code(404)
          .send({ success: false, error: "Assessment not found" });
      }

      if (assessment.status !== "evaluated") {
        return reply.code(202).send(
          successResponse({
            ready: false,
            status: assessment.status,
            message: "Assessment evaluation in progress",
          }),
        );
      }

      return successResponse({
        ready: true,
        overallScore: assessment.overallScore,
        tier: assessment.tier,
        dimensions: {
          modelKnowledge: assessment.modelKnowledge,
          engineeringDepth: assessment.engineeringDepth,
          systemDesign: assessment.systemDesign,
          codingQuality: assessment.codingQuality,
          practicalApp: assessment.practicalApp,
          communication: assessment.communication,
        },
        reportUrl: assessment.reportUrl,
        skillGapAnalysis: assessment.skillGapAnalysis,
        improvementRoadmap: assessment.improvementRoadmap,
        flagged: assessment.flagged,
        plagiarismFlagged: assessment.plagiarismFlagged,
      });
    },
  );

  // Get assessment history
  fastify.get(
    "/assessment/history",
    { preHandler: [authenticate, requireEngineer] },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const user = (request as any).user;
      const userId = user.userId ?? user.id;

      const assessments = await prisma.assessment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          tier: true,
          overallScore: true,
          startedAt: true,
          submittedAt: true,
          evaluatedAt: true,
          flagged: true,
        },
      });

      return successResponse(assessments);
    },
  );

  // Record proctoring event
  fastify.post(
    "/assessment/:id/proctor-event",
    { preHandler: [authenticate, requireEngineer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as any;
      const body = proctoringEventSchema.parse(request.body);
      const assessment = await prisma.assessment.findUnique({ where: { id } });
      if (!assessment) {
        return reply
          .code(404)
          .send({ success: false, error: "Assessment not found" });
      }

      const events = parseJsonLike(assessment.proctoringEvents);
      events.push({ ...body, recordedAt: new Date().toISOString() });

      const updateData: any = {
        proctoringEvents: events,
      };

      if (body.type === "tab_switch") updateData.tabSwitches = { increment: 1 };
      if (body.type === "window_blur") updateData.focusLosses = { increment: 1 };
      if (body.type === "paste_attempt")
        updateData.pasteAttempts = { increment: 1 };

      await prisma.assessment.update({ where: { id }, data: updateData });

      return successResponse({ recorded: true });
    },
  );

  // Backward-compat alias
  fastify.post(
    "/assessment/:id/proctoring-event",
    { preHandler: [authenticate, requireEngineer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const body = proctoringEventSchema.parse(request.body);
      const assessment = await prisma.assessment.findUnique({ where: { id } });
      if (!assessment) {
        return reply.code(404).send({ success: false, error: "Assessment not found" });
      }
      const events = parseJsonLike(assessment.proctoringEvents);
      events.push({ ...body, recordedAt: new Date().toISOString() });
      await prisma.assessment.update({
        where: { id },
        data: { proctoringEvents: events },
      });
      return successResponse({ recorded: true });
    },
  );
}
