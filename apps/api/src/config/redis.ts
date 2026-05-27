import Redis from "ioredis";
import { getEnv } from "./env";
import { MemoryRedis } from "./redis-memory";

let redis: Redis | MemoryRedis;

export function getRedisClient(): Redis | MemoryRedis {
  if (!redis) {
    const env = getEnv();

    if (env.REDIS_URL === "memory://") {
      redis = new MemoryRedis();
      console.log("✅ Using in-memory Redis (development)");
      return redis;
    }

    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying after 3 attempts
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
      lazyConnect: false,
    });

    redis.on("error", (err) => {
      // Suppress noisy ECONNREFUSED spam from retry attempts
      if ((err as any).code !== "ECONNREFUSED") {
        console.error("Redis error:", err);
      }
    });

    redis.on("connect", () => {
      console.log("✅ Redis connected successfully");
    });
  }

  return redis;
}

export async function connectRedis(): Promise<void> {
  try {
    const client = getRedisClient();
    await client.ping();
    if (getEnv().REDIS_URL !== "memory://") {
      console.log("✅ Redis connection verified");
    }
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
    if (getEnv().NODE_ENV === "development") {
      console.warn(
        "⚠️  Set REDIS_URL=memory:// in .env.local to run without Redis",
      );
    }
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    console.log("Redis disconnected");
  }
}

