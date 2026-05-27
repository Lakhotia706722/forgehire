import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AssessmentService } from "../services/assessment.service";
import { authenticate, requireEngineer } from "../middleware/auth";
import { successResponse } from "@neuronhire/shared";
import { z } from "zod";

const submitSchema = z.object({
  mcqResponses: z.array(z.any()),
  codingSubmissions: z.array(z.any()),
  caseResponse: z.string(),
});

const proctoringEventSchema = z.object({
  type: z.enum([
    "tab_switch",
    "focus_loss",
    "paste_attempt",
    "copy_attempt",
    "right_click",
  ]),
  timestamp: z.string(),
  metadata: z.record(z.any()).optional(),
});

export async function assessmentRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const assessmentService = new AssessmentService();

  // Generate new assessment
  fastify.post(
    "/assessment/generate",
    { preHandler: [authenticate, requireEngineer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const prisma = (assessmentService as any).prisma;

      const profile = await prisma.engineerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        return reply
          .code(404)
          .send({ success: false, error: "Engineer profile not found" });
      }

      const result = await assessmentService.generateAssessment(
        profile.id,
        user.id,
      );
      return reply.code(201).send(successResponse(result));
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

  // Submit assessment
  fastify.post(
    "/assessment/:id/submit",
    { preHandler: [authenticate, requireEngineer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
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
        return reply
          .code(202)
          .send({ success: false, error: "Assessment evaluation in progress" });
      }

      return successResponse({
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
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const prisma = (assessmentService as any).prisma;

      const assessments = await prisma.assessment.findMany({
        where: { userId: user.id },
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
    "/assessment/:id/proctoring-event",
    { preHandler: [authenticate, requireEngineer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as any;
      const body = proctoringEventSchema.parse(request.body);
      const prisma = (assessmentService as any).prisma;

      const assessment = await prisma.assessment.findUnique({ where: { id } });
      if (!assessment) {
        return reply
          .code(404)
          .send({ success: false, error: "Assessment not found" });
      }

      const events = JSON.parse(
        (assessment.proctoringEvents as string) || "[]",
      );
      events.push({ ...body, recordedAt: new Date().toISOString() });

      const updateData: any = {
        proctoringEvents: JSON.stringify(events),
      };

      if (body.type === "tab_switch") updateData.tabSwitches = { increment: 1 };
      if (body.type === "focus_loss") updateData.focusLosses = { increment: 1 };
      if (body.type === "paste_attempt")
        updateData.pasteAttempts = { increment: 1 };

      await prisma.assessment.update({ where: { id }, data: updateData });

      return successResponse({ recorded: true });
    },
  );
}
