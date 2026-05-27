import { ConnectionOptions } from "bullmq";
import { getEnv } from "./env";

/** BullMQ requires a real Redis connection — not available with memory:// */
export function getBullMQConnection(): ConnectionOptions | null {
  const redisUrl = getEnv().REDIS_URL;
  if (redisUrl === "memory://") {
    return null;
  }

  try {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      tls: parsed.protocol === "rediss:" ? {} : undefined,
      maxRetriesPerRequest: null,
    };
  } catch {
    return {
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT || 6379),
      maxRetriesPerRequest: null,
    };
  }
}

export function isQueueEnabled(): boolean {
  return getBullMQConnection() !== null;
}
