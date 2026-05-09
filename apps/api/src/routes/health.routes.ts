import { FastifyInstance } from 'fastify';
import { getPrismaClient } from '../config/database';
import { getRedisClient } from '../config/redis';
import { getEnv } from '../config/env';

export async function healthRoutes(app: FastifyInstance) {
  /**
   * Basic health check — GET /health
   */
  app.get('/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  });

  /**
   * Detailed health check with all services — GET /health/detailed
   */
  app.get('/health/detailed', async (_request, reply) => {
    const startTime = Date.now();
    const prisma = getPrismaClient();
    const redis = getRedisClient();

    const checks: Record<string, { status: string; responseTime?: number; error?: string }> = {
      api: { status: 'ok', responseTime: 0 }
    };

    // Database
    try {
      const t = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'ok', responseTime: Date.now() - t };
    } catch (err: any) {
      checks.database = { status: 'down', error: err.message };
    }

    // Redis
    try {
      const t = Date.now();
      await redis.ping();
      checks.redis = { status: 'ok', responseTime: Date.now() - t };
    } catch (err: any) {
      checks.redis = { status: 'down', error: err.message };
    }

    const allOk = Object.values(checks).every(c => c.status === 'ok');
    const code = allOk ? 200 : 503;

    return reply.code(code).send({
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      uptime: process.uptime(),
      checks,
      totalResponseTime: Date.now() - startTime
    });
  });

  /**
   * Readiness probe — GET /health/ready
   */
  app.get('/health/ready', async (_request, reply) => {
    const prisma = getPrismaClient();
    const redis = getRedisClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      await redis.ping();
      return reply.send({ status: 'ready', timestamp: new Date().toISOString() });
    } catch (err: any) {
      return reply.code(503).send({
        status: 'not ready',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Liveness probe — GET /health/live
   */
  app.get('/health/live', async (_request, reply) => {
    return reply.send({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
}

/**
 * Alert PagerDuty on critical failures
 */
export async function alertPagerDuty(title: string, details: string) {
  const routingKey = getEnv('PAGERDUTY_ROUTING_KEY');
  if (!routingKey) return;
  try {
    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routing_key: routingKey,
        event_action: 'trigger',
        payload: {
          summary: title,
          severity: 'critical',
          source: 'neuronhire-api',
          custom_details: { details }
        }
      })
    });
  } catch (err) {
    console.error('PagerDuty alert error:', err);
  }
}
