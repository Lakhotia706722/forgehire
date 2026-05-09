import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TaskService } from '../services/task.service';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  createTaskSchema,
  depositEscrowSchema,
  participateTaskSchema,
  submitTaskSchema,
  evaluateSubmissionSchema,
  selectWinnerSchema,
  selectMultipleWinnersSchema,
  askQuestionSchema,
  answerQuestionSchema,
  signNDASchema,
  taskSearchSchema
} from '@neuronhire/shared';

export async function taskRoutes(fastify: FastifyInstance) {
  const taskService = new TaskService();

  // Create task
  fastify.post(
    '/tasks',
    {
      preHandler: [authenticate, requireRole(UserRole.company)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const data = createTaskSchema.parse((request.body as any));

        const task = await taskService.createTask(userId, data);

        return reply.code(201).send({
          success: true,
          data: task,
          message: 'Task created successfully. AI enrichment in progress.'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Update task
  fastify.put(
    '/tasks/:id',
    {
      preHandler: [authenticate, requireRole(UserRole.company)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // const userId = (request as any).user.userId;
        // const { id } = (request.params as any);
        // const data = updateTaskSchema.parse((request.body as any));

        // Implementation would go here
        return reply.code(200).send({
          success: true,
          message: 'Task update not yet implemented'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Create escrow order
  fastify.post(
    '/tasks/:id/escrow/create',
    {
      preHandler: [authenticate, requireRole(UserRole.company)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);

        const order = await taskService.createEscrowOrder(id, userId);

        return reply.code(200).send({
          success: true,
          data: order,
          message: 'Escrow order created. Complete payment to publish task.'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Deposit escrow (verify payment)
  fastify.post(
    '/tasks/:id/escrow/deposit',
    {
      preHandler: [authenticate, requireRole(UserRole.company)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);
        const data = depositEscrowSchema.parse((request.body as any));

        const task = await taskService.depositEscrow(id, userId, data);

        return reply.code(200).send({
          success: true,
          data: task,
          message: 'Escrow deposited successfully. Task is now live!'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get task feed
  fastify.get(
    '/tasks',
    {
      preHandler: []
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const filters = taskSearchSchema.parse((request.query as any));
        
        // Get engineer profile ID if authenticated
        let engineerProfileId: string | undefined;
        if ((request as any).user) {
          const userId = (request as any).user.userId;
          const user = await (taskService as any).prisma.user.findUnique({
            where: { id: userId },
            include: { engineerProfile: true }
          });
          engineerProfileId = user?.engineerProfile?.id;
        }

        const result = await taskService.getTaskFeed(filters, engineerProfileId);

        return reply.code(200).send({
          success: true,
          data: result.items,
          meta: {
            nextCursor: result.nextCursor,
            hasMore: result.hasMore
          }
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get task by ID
  fastify.get(
    '/tasks/:id',
    {
      preHandler: []
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = (request.params as any);
        const userId = (request as any).user?.userId;

        const task = await taskService.getTask(id, userId);

        return reply.code(200).send({
          success: true,
          data: task
        });
      } catch (error: any) {
        return reply.code(404).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Participate in task
  fastify.post(
    '/tasks/:id/participate',
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);
        const data = participateTaskSchema.parse((request.body as any));

        const participation = await taskService.participateInTask(id, userId, data);

        return reply.code(201).send({
          success: true,
          data: participation,
          message: 'Successfully registered for task'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Submit work
  fastify.post(
    '/tasks/:id/submit',
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);
        const data = submitTaskSchema.parse((request.body as any));

        const submission = await taskService.submitTask(id, userId, data);

        return reply.code(201).send({
          success: true,
          data: submission,
          message: 'Work submitted successfully'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // List submissions for a task (company view)
  fastify.get(
    '/tasks/:id/submissions',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as any;
      const prisma = (taskService as any).prisma;

      const submissions = await prisma.taskSubmission.findMany({
        where: { taskId: id },
        orderBy: [{ score: 'desc' }, { submittedAt: 'asc' }],
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
    }
  );

  // Get single submission detail
  fastify.get(
    '/tasks/:id/submissions/:submissionId',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
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
        return reply.code(404).send({ success: false, error: 'Submission not found' });
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
          performanceMetrics: submission.performanceMetrics,
          screenshots: submission.screenshots,
        },
      });
    }
  );

  // Approve submission (company)
  fastify.post(
    '/tasks/:id/submissions/:submissionId/approve',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { submissionId } = request.params as any;
      const prisma = (taskService as any).prisma;

      const updated = await prisma.taskSubmission.update({
        where: { id: submissionId },
        data: { status: 'accepted', reviewedAt: new Date() },
      });

      return reply.send({ success: true, data: updated });
    }
  );

  // Reject submission (company)
  fastify.post(
    '/tasks/:id/submissions/:submissionId/reject',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { submissionId } = request.params as any;
      const { feedback } = request.body as any;
      const prisma = (taskService as any).prisma;

      const updated = await prisma.taskSubmission.update({
        where: { id: submissionId },
        data: { status: 'rejected', feedback, reviewedAt: new Date() },
      });

      return reply.send({ success: true, data: updated });
    }
  );

  // Evaluate submission
  fastify.post(
    '/tasks/:id/submissions/:submissionId/evaluate',
    {
      preHandler: [authenticate, requireRole(UserRole.company)]
    },
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const userId = (request as any).user.userId;
        const { submissionId } = (request.params as any);
        const data = evaluateSubmissionSchema.parse((request.body as any));

        const submission = await taskService.evaluateSubmission(
          submissionId,
          userId,
          data
        );

        return reply.code(200).send({
          success: true,
          data: submission,
          message: 'Submission evaluated successfully'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Select winner (single)
  fastify.put(
    '/tasks/:id/winner',
    {
      preHandler: [authenticate, requireRole(UserRole.company)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);
        const data = selectWinnerSchema.parse((request.body as any));

        const result = await taskService.selectWinner(id, userId, data);

        return reply.code(200).send({
          success: true,
          data: result,
          message: 'Winner selected. Payout initiated.'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Select multiple winners (contest)
  fastify.put(
    '/tasks/:id/winners',
    {
      preHandler: [authenticate, requireRole(UserRole.company)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);
        const data = selectMultipleWinnersSchema.parse((request.body as any));

        const result = await taskService.selectMultipleWinners(id, userId, data);

        return reply.code(200).send({
          success: true,
          data: result,
          message: 'Winners selected. Payouts initiated.'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Ask question
  fastify.post(
    '/tasks/:id/questions',
    {
      preHandler: [authenticate, requireRole(UserRole.engineer, UserRole.company)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);
        const data = askQuestionSchema.parse((request.body as any));

        const question = await taskService.askQuestion(id, userId, data);

        return reply.code(201).send({
          success: true,
          data: question,
          message: 'Question posted successfully'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Answer question
  fastify.put(
    '/tasks/:id/questions/:questionId/answer',
    {
      preHandler: [authenticate, requireRole(UserRole.company)]
    },
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const userId = (request as any).user.userId;
        const { questionId } = (request.params as any);
        const data = answerQuestionSchema.parse((request.body as any));

        const question = await taskService.answerQuestion(questionId, userId, data);

        return reply.code(200).send({
          success: true,
          data: question,
          message: 'Question answered successfully'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Generate NDA
  fastify.post(
    '/tasks/:id/nda/generate',
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);

        const nda = await taskService.generateNDA(id, userId);

        return reply.code(200).send({
          success: true,
          data: nda,
          message: 'NDA generated. Please review and sign.'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Sign NDA
  fastify.post(
    '/tasks/:id/nda/sign',
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);
        
        // Get IP address from request
        const ipAddress = request.ip || '0.0.0.0';
        
        const bodyData = signNDASchema.parse((request.body as any));
        const data = { ...bodyData, ipAddress };

        const nda = await taskService.signNDA(id, userId, data);

        return reply.code(200).send({
          success: true,
          data: nda,
          message: 'NDA signed successfully. You can now view full task details.'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );
}



