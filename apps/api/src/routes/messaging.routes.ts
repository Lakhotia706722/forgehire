import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MessagingService } from '../services/messaging.service';
import { authenticate } from '../middleware/auth';
import { successResponse } from '@neuronhire/shared';
import { z } from 'zod';

const sendRequestSchema = z.object({
  toUserId: z.string().uuid(),
  message: z.string().min(1).max(500),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

export async function messagingRoutes(fastify: FastifyInstance): Promise<void> {
  const messagingService = new MessagingService();

  // Get all conversations
  fastify.get(
    '/messages/conversations',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const conversations = await messagingService.getUserConversations(user.id);
      return successResponse(conversations);
    }
  );

  // Get conversation messages
  fastify.get(
    '/messages/conversations/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params as any;
      const { limit, cursor } = request.query as any;

      const result = await messagingService.getConversationMessages(
        id,
        user.id,
        limit ? parseInt(limit) : 50,
        cursor
      );

      return successResponse(result);
    }
  );

  // Send message in conversation
  fastify.post(
    '/messages/conversations/:id/send',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params as any;
      const body = sendMessageSchema.parse(request.body);

      // Get the other participant from conversation
      const prisma = (messagingService as any).prisma;
      const conversation = await prisma.conversation.findUnique({ where: { id } });

      if (!conversation) {
        return reply.code(404).send({ success: false, error: 'Conversation not found' });
      }

      const recipientId =
        conversation.participant1Id === user.id
          ? conversation.participant2Id
          : conversation.participant1Id;

      const message = await messagingService.sendMessage(user.id, recipientId, body.content);
      return reply.code(201).send(successResponse(message));
    }
  );

  // Send message request
  fastify.post(
    '/messages/request',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const body = sendRequestSchema.parse(request.body);

      const messageRequest = await messagingService.sendMessageRequest(
        user.id,
        body.toUserId,
        body.message
      );

      return reply.code(201).send(successResponse(messageRequest));
    }
  );

  // Accept message request
  fastify.put(
    '/messages/request/:id/accept',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params as any;

      const result = await messagingService.respondToMessageRequest(id, user.id, true);
      return successResponse(result);
    }
  );

  // Decline message request
  fastify.put(
    '/messages/request/:id/decline',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params as any;

      const result = await messagingService.respondToMessageRequest(id, user.id, false);
      return successResponse(result);
    }
  );

  // Upload file for message
  fastify.post(
    '/messages/conversations/:id/files',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({ success: false, error: 'No file uploaded' });
      }

      const buffer = await data.toBuffer();
      const result = await messagingService.uploadMessageFile(
        buffer,
        data.filename,
        data.mimetype
      );

      return successResponse(result);
    }
  );

  // Get pending message requests
  fastify.get(
    '/messages/requests/pending',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const requests = await messagingService.getPendingMessageRequests(user.id);
      return successResponse(requests);
    }
  );
}
