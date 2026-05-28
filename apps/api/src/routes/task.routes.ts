import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { TaskService } from "../services/task.service";
import { authenticate, requireRole, tryAuthenticate } from "../middleware/auth";
import { UserRole } from "@prisma/client";
import { getMongoDB } from "../config/mongodb";
import { getRedisClient } from "../config/redis";
import {
  createTaskSchema,
  updateTaskSchema,
  depositEscrowSchema,
  participateTaskSchema,
  submitTaskSchema,
  evaluateSubmissionSchema,
  selectWinnerSchema,
  selectMultipleWinnersSchema,
  askQuestionSchema,
  answerQuestionSchema,
  signNDASchema,
  taskSearchSchema,
} from "@neuronhire/shared";
import { z } from "zod";
import { TaskAIEnrichmentService } from "../services/task-ai-enrichment.service";

export function getTaskRouteErrorStatus(errorMessage: string): number {
  const message = errorMessage.toLowerCase();
  if (
    message.includes("unauthorized") ||
    (message.includes("only") && message.includes("can"))
  ) {
    return 403;
  }
  if (message.includes("not found")) return 404;
  if (
    message.includes("already") ||
    message.includes("duplicate") ||
    message.includes("finalized") ||
    message.includes("rejected") ||
    message.includes("cannot be updated") ||
    message.includes("cannot be closed") ||
    message.includes("must participate") ||
    message.includes("not open for participation") ||
    message.includes("not accepting submissions") ||
    message.includes("not accepting questions") ||
    message.includes("retake") ||
    message.includes("below minimum")
  ) {
    return 409;
  }
  return 400;
}

export async function taskRoutes(fastify: FastifyInstance) {
  const taskService = new TaskService();
  const taskAIService = new TaskAIEnrichmentService();
  const miniGateSubmitSchema = z.object({
    testId: z.string().uuid(),
    answers: z.array(
      z.object({
        questionId: z.string(),
        selectedOption: z.number().int().min(0),
      }),
    ),
  });
  const rejectParticipationSchema = z.object({
    rejectionReason: z.string().max(1000).optional().nullable(),
  });
  const taskAIPreviewSchema = z.object({
    title: z.string().min(5),
    type: z.enum(["bounty", "direct", "contest"]),
    problemStatement: z.string().min(50),
    expectedOutcome: z.string().min(20),
    deliverables: z
      .array(
        z.object({
          title: z.string().min(1),
          description: z.string().optional().default(""),
        }),
      )
      .min(1),
    techRequirements: z.array(z.string().min(1)).min(1),
    timeline: z.number().int().min(1),
    rewardAmount: z.number().min(1000),
    difficulty: z.enum(["easy", "medium", "hard", "expert"]).optional(),
    category: z.array(z.string()).optional(),
  });

  // Create task
  fastify.post(
    "/tasks",
    {
      preHandler: [authenticate, requireRole(UserRole.company)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const data = createTaskSchema.parse(request.body as any);

        const task = await taskService.createTask(userId, data);

        return reply.code(201).send({
          success: true,
          data: task,
          message: "Task created successfully. AI enrichment in progress.",
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to select winner";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // AI preview for task quality/reward/timeline guidance
  fastify.post(
    "/tasks/ai-preview",
    {
      preHandler: [authenticate, requireRole(UserRole.company)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const payload = taskAIPreviewSchema.parse(request.body);
        const enrichment = await taskAIService.enrichTask(payload);
        return reply.code(200).send({
          success: true,
          data: {
            estimatedTimeline: `${Math.max(1, enrichment.estimatedTimeline - 2)}-${enrichment.estimatedTimeline + 2} days`,
            suggestedRewardRange: {
              min: enrichment.suggestedReward.min,
              max: enrichment.suggestedReward.max,
            },
            qualityScore: enrichment.postingQuality,
            qualityIssues: enrichment.vagueDeliverables,
            recommendedTaskType: enrichment.recommendedType,
            suggestedSkillTags: enrichment.autoTaggedSkills,
            similarCompletedBounties: [],
            suggestions: enrichment.suggestions,
          },
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to generate AI preview";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Update task
  fastify.put(
    "/tasks/:id",
    {
      preHandler: [authenticate, requireRole(UserRole.company)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = request.params as { id: string };
        const data = updateTaskSchema.parse(request.body as any);
        const task = await taskService.updateTask(id, userId, data);
        return reply.code(200).send({
          success: true,
          data: task,
          message: "Task updated successfully. AI enrichment queued.",
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to select winners";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Create escrow order
  fastify.post(
    "/tasks/:id/escrow/create",
    {
      preHandler: [authenticate, requireRole(UserRole.company)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = request.params as any;

        const order = await taskService.createEscrowOrder(id, userId);

        return reply.code(200).send({
          success: true,
          data: order,
          message: "Escrow order created. Complete payment to publish task.",
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to update task";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Close task
  fastify.post(
    "/tasks/:id/close",
    {
      preHandler: [authenticate, requireRole(UserRole.company)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = request.params as { id: string };
        const task = await taskService.closeTask(id, userId);
        return reply.code(200).send({
          success: true,
          data: task,
          message: "Task closed successfully.",
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to close task";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Deposit escrow (verify payment)
  fastify.post(
    "/tasks/:id/escrow/deposit",
    {
      preHandler: [authenticate, requireRole(UserRole.company)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = request.params as any;
        const data = depositEscrowSchema.parse(request.body as any);

        const task = await taskService.depositEscrow(id, userId, data);

        return reply.code(200).send({
          success: true,
          data: task,
          message: "Escrow deposited successfully. Task is now live!",
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to participate in task";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Engineer's bounty submissions
  fastify.get(
    "/tasks/my-submissions",
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const submissions = await taskService.getEngineerSubmissions(userId);
        return reply.code(200).send({ success: true, data: submissions });
      } catch (error: any) {
        const message = error?.message ?? "Failed to submit work";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Get company's own tasks
  fastify.get(
    "/tasks/mine",
    {
      preHandler: [authenticate, requireRole(UserRole.company)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { status, limit } = request.query as {
          status?: string;
          limit?: string;
        };

        const tasks = await taskService.getCompanyTasks(userId, {
          status,
          limit: limit ? Number(limit) : undefined,
        });

        return reply.code(200).send({
          success: true,
          data: tasks,
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to evaluate submission";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Get task feed
  fastify.get(
    "/tasks",
    {
      preHandler: [tryAuthenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const rawQuery = request.query as Record<string, unknown>;
        const filters = taskSearchSchema.parse({
          ...rawQuery,
          limit: rawQuery.limit != null ? Number(rawQuery.limit) : undefined,
          minReward: rawQuery.minReward != null ? Number(rawQuery.minReward) : undefined,
          maxReward: rawQuery.maxReward != null ? Number(rawQuery.maxReward) : undefined,
          minNeuronScore:
            rawQuery.minNeuronScore != null ? Number(rawQuery.minNeuronScore) : undefined,
          maxNeuronScore:
            rawQuery.maxNeuronScore != null ? Number(rawQuery.maxNeuronScore) : undefined,
        });

        // Get engineer profile ID if authenticated
        let engineerProfileId: string | undefined;
        if ((request as any).user) {
          const userId = (request as any).user.userId;
          const user = await (taskService as any).prisma.user.findUnique({
            where: { id: userId },
            include: { engineerProfile: true },
          });
          engineerProfileId = user?.engineerProfile?.id;
        }

        const result = await taskService.getTaskFeed(
          filters,
          engineerProfileId,
        );

        return reply.code(200).send({
          success: true,
          data: result.items,
          meta: {
            nextCursor: result.nextCursor,
            hasMore: result.hasMore,
          },
        });
      } catch (error: any) {
        const message = error?.message ?? 'Failed to load tasks';
        const isDbMissing =
          message.includes('does not exist') ||
          message.includes('P2021') ||
          message.includes('P1001');
        if (isDbMissing) {
          return reply.code(200).send({
            success: true,
            data: [],
            meta: { nextCursor: null, hasMore: false },
          });
        }
        return reply.code(400).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Get task by ID
  fastify.get(
    "/tasks/:id",
    {
      preHandler: [tryAuthenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as any;
        const userId = (request as any).user?.userId;

        const task = await taskService.getTask(id, userId);

        return reply.code(200).send({
          success: true,
          data: task,
        });
      } catch (error: any) {
        return reply.code(404).send({
          success: false,
          error: error.message,
        });
      }
    },
  );

  // Participate in task
  fastify.post(
    "/tasks/:id/participate",
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = request.params as any;
        const data = participateTaskSchema.parse(request.body as any);

        const participation = await taskService.participateInTask(
          id,
          userId,
          data,
        );

        return reply.code(201).send({
          success: true,
          data: participation,
          message: "Successfully registered for task",
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to participate in task";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Approve participation (company)
  fastify.post(
    "/tasks/:id/participations/:participationId/approve",
    { preHandler: [authenticate, requireRole(UserRole.company)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id, participationId } = request.params as {
          id: string;
          participationId: string;
        };
        const updated = await taskService.approveParticipation(id, participationId, userId);
        return reply.code(200).send({
          success: true,
          data: updated,
          message: "Participant approved",
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to approve participant";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Reject participation (company)
  fastify.post(
    "/tasks/:id/participations/:participationId/reject",
    { preHandler: [authenticate, requireRole(UserRole.company)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id, participationId } = request.params as {
          id: string;
          participationId: string;
        };
        const body = rejectParticipationSchema.parse(request.body as any);
        const updated = await taskService.rejectParticipation(
          id,
          participationId,
          userId,
          body.rejectionReason,
        );
        return reply.code(200).send({
          success: true,
          data: updated,
          message: "Participant rejected",
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to reject participant";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Submit work
  fastify.post(
    "/tasks/:id/submit",
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = request.params as any;
        const data = submitTaskSchema.parse(request.body as any);

        const submission = await taskService.submitTask(id, userId, data);

        return reply.code(201).send({
          success: true,
          data: submission,
          message: "Work submitted successfully",
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to submit work";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // List submissions for a task (company view)
  fastify.get(
    "/tasks/:id/submissions",
    { preHandler: [authenticate, requireRole(UserRole.company)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.userId;
      const { id } = request.params as any;
      const prisma = (taskService as any).prisma;

      const task = await prisma.task.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });
      if (!task) {
        return reply
          .code(404)
          .send({ success: false, error: "Task not found" });
      }
      if (task.userId !== userId) {
        return reply.code(403).send({ success: false, error: "Unauthorized" });
      }

      const submissions = await prisma.taskSubmission.findMany({
        where: { taskId: id },
        orderBy: [{ score: "desc" }, { submittedAt: "asc" }],
        include: {
          engineerProfile: {
            select: { fullName: true, neuronScore: true, id: true },
          },
        },
      });

      return reply.send({
        success: true,
        data: submissions.map((s: any) => ({
          id: s.id,
          engineerName: s.engineerProfile.fullName,
          engineerProfileId: s.engineerProfile.id,
          neuronScore: s.engineerProfile.neuronScore,
          score: s.score,
          status: s.status,
          submittedAt: s.submittedAt,
          demoUrl: s.demoUrl,
          githubUrl: s.githubUrl,
        })),
      });
    },
  );

  // Get single submission detail
  fastify.get(
    "/tasks/:id/submissions/:submissionId",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user as { userId?: string; role?: UserRole };
      const userId = (user?.userId ?? "") as string;
      const { id, submissionId } = request.params as any;
      const prisma = (taskService as any).prisma;

      const submission = await prisma.taskSubmission.findUnique({
        where: { id: submissionId },
        include: {
          engineerProfile: {
            select: { fullName: true, neuronScore: true, id: true },
          },
        },
      });

      if (!submission || submission.taskId !== id) {
        return reply
          .code(404)
          .send({ success: false, error: "Submission not found" });
      }

      if (user?.role === UserRole.company) {
        const task = await prisma.task.findUnique({
          where: { id },
          select: { userId: true },
        });
        if (!task || task.userId !== userId) {
          return reply.code(403).send({ success: false, error: "Unauthorized" });
        }
      } else if (user?.role === UserRole.engineer) {
        const engineer = await prisma.engineerProfile.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (!engineer || submission.engineerProfileId !== engineer.id) {
          return reply.code(403).send({ success: false, error: "Unauthorized" });
        }
      } else {
        return reply.code(403).send({ success: false, error: "Unauthorized" });
      }

      return reply.send({
        success: true,
        data: {
          id: submission.id,
          taskId: submission.taskId,
          engineerName: submission.engineerProfile.fullName,
          engineerProfileId: submission.engineerProfile.id,
          neuronScore: submission.engineerProfile.neuronScore,
          score: submission.score,
          status: submission.status,
          submittedAt: submission.submittedAt,
          description: submission.description,
          demoUrl: submission.demoUrl,
          githubUrl: submission.githubUrl,
          videoUrl: submission.videoUrl,
          architectureDiagram: submission.architectureDiagram,
          performanceMetrics: submission.performanceMetrics,
          screenshots: submission.screenshots,
          feedback: submission.feedback,
          criteriaScores: submission.criteriaScores,
        },
      });
    },
  );

  // Approve submission (company)
  fastify.post(
    "/tasks/:id/submissions/:submissionId/approve",
    { preHandler: [authenticate, requireRole(UserRole.company)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.userId;
      const { id, submissionId } = request.params as any;
      const prisma = (taskService as any).prisma;

      const existing = await prisma.taskSubmission.findUnique({
        where: { id: submissionId },
        include: {
          task: { select: { id: true, userId: true, companyProfileId: true } },
          engineerProfile: { select: { id: true } },
        },
      });
      if (!existing || existing.task.id !== id) {
        return reply
          .code(404)
          .send({ success: false, error: "Submission not found" });
      }
      if (existing.task.userId !== userId) {
        return reply.code(403).send({ success: false, error: "Unauthorized" });
      }
      if (["accepted", "rejected", "winner"].includes(existing.status)) {
        const error = `Submission already finalized with status: ${existing.status}`;
        return reply.code(getTaskRouteErrorStatus(error)).send({
          success: false,
          error,
        });
      }

      const updated = await prisma.taskSubmission.update({
        where: { id: submissionId },
        data: { status: "accepted", reviewedAt: new Date() },
      });
      await getRedisClient().del(
        `dashboard:company:${existing.task.companyProfileId}`,
        `dashboard:engineer:v2:${existing.engineerProfile.id}`,
      );

      return reply.send({ success: true, data: updated });
    },
  );

  // Reject submission (company)
  fastify.post(
    "/tasks/:id/submissions/:submissionId/reject",
    { preHandler: [authenticate, requireRole(UserRole.company)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.userId;
      const { id, submissionId } = request.params as any;
      const { feedback } = request.body as any;
      const prisma = (taskService as any).prisma;

      const existing = await prisma.taskSubmission.findUnique({
        where: { id: submissionId },
        include: {
          task: { select: { id: true, userId: true, companyProfileId: true } },
          engineerProfile: { select: { id: true } },
        },
      });
      if (!existing || existing.task.id !== id) {
        return reply
          .code(404)
          .send({ success: false, error: "Submission not found" });
      }
      if (existing.task.userId !== userId) {
        return reply.code(403).send({ success: false, error: "Unauthorized" });
      }
      if (["accepted", "rejected", "winner"].includes(existing.status)) {
        const error = `Submission already finalized with status: ${existing.status}`;
        return reply.code(getTaskRouteErrorStatus(error)).send({
          success: false,
          error,
        });
      }

      const updated = await prisma.taskSubmission.update({
        where: { id: submissionId },
        data: { status: "rejected", feedback, reviewedAt: new Date() },
      });
      await getRedisClient().del(
        `dashboard:company:${existing.task.companyProfileId}`,
        `dashboard:engineer:v2:${existing.engineerProfile.id}`,
      );

      return reply.send({ success: true, data: updated });
    },
  );

  // Evaluate submission
  fastify.post(
    "/tasks/:id/submissions/:submissionId/evaluate",
    {
      preHandler: [authenticate, requireRole(UserRole.company)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id, submissionId } = request.params as any;
        const data = evaluateSubmissionSchema.parse(request.body as any);
        const prisma = (taskService as any).prisma;

        const existing = await prisma.taskSubmission.findUnique({
          where: { id: submissionId },
          include: {
            task: { select: { id: true, userId: true, companyProfileId: true } },
            engineerProfile: { select: { id: true } },
          },
        });
        if (!existing || existing.task.id !== id) {
          return reply
            .code(404)
            .send({ success: false, error: "Submission not found" });
        }
        if (existing.task.userId !== userId) {
          return reply.code(403).send({ success: false, error: "Unauthorized" });
        }
        if (["accepted", "rejected", "winner"].includes(existing.status)) {
          const error = `Submission already finalized with status: ${existing.status}`;
          return reply.code(getTaskRouteErrorStatus(error)).send({
            success: false,
            error,
          });
        }

        const submission = await taskService.evaluateSubmission(
          submissionId,
          userId,
          data,
        );
        await getRedisClient().del(
          `dashboard:company:${existing.task.companyProfileId}`,
          `dashboard:engineer:v2:${existing.engineerProfile.id}`,
        );

        return reply.code(200).send({
          success: true,
          data: submission,
          message: "Submission evaluated successfully",
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to evaluate submission";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Select winner (single)
  fastify.put(
    "/tasks/:id/winner",
    {
      preHandler: [authenticate, requireRole(UserRole.company)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = request.params as any;
        const data = selectWinnerSchema.parse(request.body as any);

        const result = await taskService.selectWinner(id, userId, data);

        return reply.code(200).send({
          success: true,
          data: result,
          message: "Winner selected. Payout initiated.",
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to select winner";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Select multiple winners (contest)
  fastify.put(
    "/tasks/:id/winners",
    {
      preHandler: [authenticate, requireRole(UserRole.company)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = request.params as any;
        const data = selectMultipleWinnersSchema.parse(request.body as any);

        const result = await taskService.selectMultipleWinners(
          id,
          userId,
          data,
        );

        return reply.code(200).send({
          success: true,
          data: result,
          message: "Winners selected. Payouts initiated.",
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to select winners";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Ask question
  fastify.post(
    "/tasks/:id/questions",
    {
      preHandler: [
        authenticate,
        requireRole(UserRole.engineer, UserRole.company),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = request.params as any;
        const data = askQuestionSchema.parse(request.body as any);

        const question = await taskService.askQuestion(id, userId, data);

        return reply.code(201).send({
          success: true,
          data: question,
          message: "Question posted successfully",
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to post question";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Answer question
  fastify.put(
    "/tasks/:id/questions/:questionId/answer",
    {
      preHandler: [authenticate, requireRole(UserRole.company)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { questionId } = request.params as any;
        const data = answerQuestionSchema.parse(request.body as any);

        const question = await taskService.answerQuestion(
          questionId,
          userId,
          data,
        );

        return reply.code(200).send({
          success: true,
          data: question,
          message: "Question answered successfully",
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to answer question";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Generate NDA
  fastify.post(
    "/tasks/:id/nda/generate",
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = request.params as any;

        const nda = await taskService.generateNDA(id, userId);

        return reply.code(200).send({
          success: true,
          data: nda,
          message: "NDA generated. Please review and sign.",
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to generate NDA";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Sign NDA
  fastify.post(
    "/tasks/:id/nda/sign",
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = request.params as any;

        // Get IP address from request
        const ipAddress = request.ip || "0.0.0.0";
        const data = signNDASchema.parse({
          ...(request.body as any),
          ipAddress,
        });

        const nda = await taskService.signNDA(id, userId, data);

        return reply.code(200).send({
          success: true,
          data: nda,
          message:
            "NDA signed successfully. You can now view full task details.",
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to sign NDA";
        return reply.code(getTaskRouteErrorStatus(message)).send({
          success: false,
          error: message,
        });
      }
    },
  );

  // Gate questions for mini-gate test
  fastify.get(
    "/tasks/:id/gate-questions",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user?.userId as string | undefined;
        const { id } = request.params as { id: string };
        if (!userId) {
          return reply.code(401).send({ success: false, error: "Unauthorized" });
        }

        // Get task to resolve relevant categories
        const task = await taskService.getTask(id, undefined);
        const categories: string[] = (task as any)?.category ?? [];

        const db = getMongoDB();
        const collection = db.collection("question_bank");

        // Try to sample from task categories first, fall back to general
        let questions: unknown[] = [];
        if (categories.length > 0) {
          questions = await collection
            .aggregate([
              { $match: { category: { $in: categories } } },
              { $sample: { size: 10 } },
            ])
            .toArray();
        }

        if (questions.length < 10) {
          const needed = 10 - questions.length;
          const existing = questions.map((q: any) => q._id?.toString());
          const fallback = await collection
            .aggregate([
              { $match: { _id: { $nin: existing } } },
              { $sample: { size: needed } },
            ])
            .toArray();
          questions = [...questions, ...fallback];
        }

        const formatted = questions.map((q: any, i: number) => ({
          id: q.id ?? q._id?.toString() ?? `q${i}`,
          number: i + 1,
          text: q.question ?? q.text ?? `Question ${i + 1}`,
          options: q.options ?? [],
          correctAnswer: q.correctAnswer ?? 0,
        }));
        const test = await taskService.startMiniGateTest(id, userId);
        await (taskService as any).prisma.miniGateTest.update({
          where: { id: test.id },
          data: { questions: formatted as any },
        });

        return reply.code(200).send({
          success: true,
          data: {
            testId: test.id,
            questions: formatted.map(({ correctAnswer: _correctAnswer, ...q }) => q),
          },
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to load mini-gate questions";
        return reply
          .code(getTaskRouteErrorStatus(message))
          .send({ success: false, error: message });
      }
    },
  );

  fastify.post(
    "/tasks/:id/gate-submit",
    { preHandler: [authenticate, requireRole(UserRole.engineer)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = request.params as { id: string };
        const data = miniGateSubmitSchema.parse(request.body as unknown);
        const result = await taskService.submitMiniGateTest(id, userId, data);
        return reply.code(200).send({ success: true, data: result });
      } catch (error: any) {
        const message = error?.message ?? "Failed to submit mini-gate test";
        return reply
          .code(getTaskRouteErrorStatus(message))
          .send({ success: false, error: message });
      }
    },
  );
}
