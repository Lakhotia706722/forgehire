import { FastifyRequest, FastifyReply } from "fastify";
import { getRedisClient } from "../config/redis";
import { RateLimitError } from "@neuronhire/shared";
import { getEnv } from "../config/env";

interface RateLimitOptions {
  max: number;
  windowMs: number;
  keyPrefix: string;
}

export async function rateLimiter(
  request: FastifyRequest,
  reply: FastifyReply,
  options: RateLimitOptions,
): Promise<void> {
  const redis = getRedisClient();
  const ip = request.ip;
  const key = `${options.keyPrefix}:${ip}`;

  try {
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.pexpire(key, options.windowMs);
    }

    if (current > options.max) {
      const ttl = await redis.pttl(key);
      reply.header("Retry-After", Math.ceil(ttl / 1000));
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${Math.ceil(ttl / 1000)} seconds`,
      );
    }

    reply.header("X-RateLimit-Limit", options.max);
    reply.header("X-RateLimit-Remaining", Math.max(0, options.max - current));
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    // If Redis fails, allow the request but log the error
    console.error("Rate limiter error:", error);
  }
}

export async function globalRateLimiter(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const env = getEnv();
  await rateLimiter(request, reply, {
    max: env.RATE_LIMIT_MAX,
    windowMs: env.RATE_LIMIT_WINDOW,
    keyPrefix: "rl:global",
  });
}

export async function otpRateLimiter(email: string): Promise<void> {
  const env = getEnv();
  const redis = getRedisClient();
  const key = `rl:otp:${email}`;

  try {
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.pexpire(key, env.OTP_RATE_LIMIT_WINDOW);
    }

    if (current > env.OTP_RATE_LIMIT_MAX) {
      const ttl = await redis.pttl(key);
      throw new RateLimitError(
        `Too many OTP requests. Try again in ${Math.ceil(ttl / 1000 / 60)} minutes`,
      );
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    console.error("OTP rate limiter error:", error);
  }
}

export async function userRateLimiter(
  userId: string,
  options: Partial<RateLimitOptions> = {},
): Promise<void> {
  const env = getEnv();
  const redis = getRedisClient();
  const key = `rl:user:${userId}`;

  const max = options.max || env.RATE_LIMIT_MAX;
  const windowMs = options.windowMs || env.RATE_LIMIT_WINDOW;

  const current = await redis.incr(key);

  if (current === 1) {
    await redis.pexpire(key, windowMs);
  }

  if (current > max) {
    const ttl = await redis.pttl(key);
    throw new RateLimitError(
      `Rate limit exceeded. Try again in ${Math.ceil(ttl / 1000)} seconds`,
    );
  }
}
