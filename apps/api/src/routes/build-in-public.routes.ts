import { FastifyInstance } from 'fastify';
import { BuildInPublicService } from '../services/build-in-public.service';
import { EngineerProfileService } from '../services/engineer-profile.service';
import { successResponse } from '@neuronhire/shared';
import { authenticate, requireEngineer } from '../middleware/auth';
import { buildInPublicActivitySchema } from '@neuronhire/shared';

export async function buildInPublicRoutes(fastify: FastifyInstance): Promise<void> {
  const bipService = new BuildInPublicService();
  const profileService = new EngineerProfileService();

  // Post activity
  fastify.post('/activities', {
    preHandler: [authenticate, requireEngineer]
  }, async (request: any, _reply) => {
    const body = buildInPublicActivitySchema.parse(request.body);
    const profile = await profileService.getOrCreateProfile(request.user.userId);
    
    const activity = await bipService.postActivity(
      profile.id,
      request.user.userId,
      body.content
    );

    return successResponse(activity);
  });

  // Get my activities
  fastify.get('/activities/me', {
    preHandler: [authenticate, requireEngineer]
  }, async (request: any, _reply) => {
    const { limit = 20, skip = 0 } = request.query as any;
    const profile = await profileService.getOrCreateProfile(request.user.userId);
    
    const activities = await bipService.getActivitiesByEngineer(
      profile.id,
      parseInt(limit),
      parseInt(skip)
    );

    const total = await bipService.getActivityCount(profile.id);

    return successResponse(activities, {
      pagination: {
        page: Math.floor(parseInt(skip) / parseInt(limit)) + 1,
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  });

  // Get activities by engineer ID
  fastify.get('/activities/engineer/:engineerProfileId', {
    preHandler: [authenticate]
  }, async (request: any, _reply) => {
    const { engineerProfileId } = request.params;
    const { limit = 20, skip = 0 } = request.query as any;
    
    const activities = await bipService.getActivitiesByEngineer(
      engineerProfileId,
      parseInt(limit),
      parseInt(skip)
    );

    const total = await bipService.getActivityCount(engineerProfileId);

    return successResponse(activities, {
      pagination: {
        page: Math.floor(parseInt(skip) / parseInt(limit)) + 1,
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  });

  // Get activity feed (all engineers)
  fastify.get('/activities/feed', {
    preHandler: [authenticate]
  }, async (request: any, _reply) => {
    const { limit = 50, skip = 0 } = request.query as any;
    
    const activities = await bipService.getActivityFeed(
      parseInt(limit),
      parseInt(skip)
    );

    return successResponse(activities);
  });

  // Delete activity
  fastify.delete('/activities/:activityId', {
    preHandler: [authenticate, requireEngineer]
  }, async (request: any, _reply) => {
    const { activityId } = request.params;
    
    await bipService.deleteActivity(activityId, request.user.userId);

    return successResponse({ message: 'Activity deleted successfully' });
  });
}
