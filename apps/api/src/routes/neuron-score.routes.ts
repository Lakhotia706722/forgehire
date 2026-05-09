import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { NeuronScoreService } from '../services/neuron-score.service';
import { authenticate, requireEngineer, requireAdmin } from '../middleware/auth';
import { successResponse } from '@neuronhire/shared';
import { getPrismaClient } from '../config/database';

export async function neuronScoreRoutes(fastify: FastifyInstance): Promise<void> {
  const neuronScoreService = new NeuronScoreService();
  const prisma = getPrismaClient();

  // Get my NeuronScore breakdown
  fastify.get(
    '/neuron-score/me',
    { preHandler: [authenticate, requireEngineer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      const profile = await prisma.engineerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        return reply.code(404).send({ success: false, error: 'Engineer profile not found' });
      }

      const breakdown = await neuronScoreService.getScoreBreakdown(profile.id);
      return successResponse(breakdown);
    }
  );

  // Get NeuronScore for a specific engineer (public)
  fastify.get(
    '/neuron-score/:engineerId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { engineerId } = request.params as any;

      const profile = await prisma.engineerProfile.findUnique({
        where: { id: engineerId },
        select: {
          id: true,
          neuronScore: true,
          neuronTier: true,
          fullName: true,
        },
      });

      if (!profile) {
        return reply.code(404).send({ success: false, error: 'Engineer not found' });
      }

      return successResponse({
        engineerId: profile.id,
        score: profile.neuronScore,
        tier: profile.neuronTier,
        name: profile.fullName,
      });
    }
  );

  // Get score history
  fastify.get(
    '/neuron-score/history',
    { preHandler: [authenticate, requireEngineer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { limit } = request.query as any;

      const profile = await prisma.engineerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        return reply.code(404).send({ success: false, error: 'Engineer profile not found' });
      }

      const history = await neuronScoreService.getScoreHistory(
        profile.id,
        limit ? parseInt(limit) : 50
      );

      return successResponse(history);
    }
  );

  // Recalculate score (admin or internal)
  fastify.post(
    '/neuron-score/recalculate',
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { engineerProfileId, reason } = request.body as any;

      if (!engineerProfileId) {
        return reply.code(400).send({ success: false, error: 'engineerProfileId is required' });
      }

      const newScore = await neuronScoreService.recalculateScore(
        engineerProfileId,
        reason || 'Manual recalculation by admin',
        undefined,
        'admin'
      );

      return successResponse({ newScore });
    }
  );
}
