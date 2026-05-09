import { FastifyInstance } from 'fastify';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { getPrismaClient } from '../config/database';
import { z } from 'zod';

const updateProfileSchema = z.object({
  profile: z.object({
    fullName: z.string().optional(),
    bio: z.string().optional(),
  }).optional(),
  notifications: z.object({
    email: z.record(z.boolean()).optional(),
    push: z.record(z.boolean()).optional(),
  }).optional(),
  privacy: z.object({
    marketingEmails: z.boolean().optional(),
    aiRecommendations: z.boolean().optional(),
    publicActivityFeed: z.boolean().optional(),
  }).optional(),
});

export async function settingsRoutes(fastify: FastifyInstance): Promise<void> {
  const prisma = getPrismaClient();

  // Get engineer settings
  fastify.get(
    '/engineer/settings',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = (request as AuthenticatedRequest).user!;

      const profile = await prisma.engineerProfile.findUnique({
        where: { userId: user.id },
        select: { fullName: true, bio: true },
      });

      if (!profile) {
        return reply.code(404).send({ success: false, error: 'Profile not found' });
      }

      // Get consent settings — only use valid ConsentType enum values
      const consents = await prisma.userConsent.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: 'desc' },
      });

      const getConsent = (type: string, defaultVal = true) => {
        const c = consents.find(c => c.consentType === type);
        return c ? c.granted : defaultVal;
      };

      return reply.send({
        profile: {
          fullName: profile.fullName,
          headline: '',
          bio: profile.bio || '',
          email: user.email,
        },
        notifications: {
          email: {
            newMessage: true,
            newBountyMatch: true,
            paymentReceived: true,
            contractUpdate: true,
          },
          push: {
            newMessage: true,
            newBountyMatch: false,
            paymentReceived: true,
            contractUpdate: false,
          },
        },
        privacy: {
          marketingEmails: getConsent('marketing_email', false),
          aiRecommendations: getConsent('profile_recommendations', true),
          publicActivityFeed: getConsent('public_activity', true),
        },
      });
    }
  );

  // Update engineer settings
  fastify.patch(
    '/engineer/settings',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = (request as AuthenticatedRequest).user!;
      const body = updateProfileSchema.parse(request.body);

      // Update profile if provided
      if (body.profile) {
        const updateData: any = {};
        if (body.profile.fullName) updateData.fullName = body.profile.fullName;
        if (body.profile.bio !== undefined) updateData.bio = body.profile.bio;
        if (Object.keys(updateData).length > 0) {
          await prisma.engineerProfile.update({
            where: { userId: user.id },
            data: updateData,
          });
        }
      }

      // Update privacy consents (only valid ConsentType enum values)
      if (body.privacy) {
        const privacyMap: Record<string, string> = {
          marketingEmails: 'marketing_email',
          aiRecommendations: 'profile_recommendations',
          publicActivityFeed: 'public_activity',
        };

        for (const [key, value] of Object.entries(body.privacy)) {
          if (value === undefined) continue;
          const consentType = privacyMap[key];
          if (!consentType) continue;

          // Use raw upsert with the enum value
          await prisma.$executeRaw`
            INSERT INTO user_consents (id, user_id, consent_type, granted, ip_address, user_agent, timestamp)
            VALUES (gen_random_uuid(), ${user.id}::uuid, ${consentType}::"ConsentType", ${value}, '0.0.0.0', '', now())
            ON CONFLICT (user_id, consent_type) DO UPDATE SET granted = ${value}
          `;
        }
      }

      return reply.send({ updated: true });
    }
  );

  // Get active sessions
  fastify.get(
    '/auth/sessions',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = (request as AuthenticatedRequest).user!;

      const tokens = await prisma.refreshToken.findMany({
        where: { userId: user.id, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const sessions = tokens.map((token, i) => ({
        id: token.id,
        device: 'Browser',
        browser: 'Chrome',
        location: 'India',
        lastActive: getRelativeTime(token.createdAt),
        isCurrent: i === 0,
      }));

      if (sessions.length === 0) {
        sessions.push({
          id: 'current',
          device: 'Current Browser',
          browser: 'Browser',
          location: 'India',
          lastActive: 'Just now',
          isCurrent: true,
        });
      }

      return reply.send(sessions);
    }
  );

  // Revoke session
  fastify.delete(
    '/auth/sessions/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = (request as AuthenticatedRequest).user!;
      const { id } = request.params as any;

      if (id === 'current') {
        return reply.code(400).send({ success: false, error: 'Cannot revoke current session' });
      }

      await prisma.refreshToken.deleteMany({ where: { id, userId: user.id } });
      return reply.send({ revoked: true });
    }
  );
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
