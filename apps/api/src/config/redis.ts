import Redis from 'ioredis';
import { getEnv } from './env';

let redis: Redis;

export function getRedisClient(): Redis {
  if (!redis) {
    const env = getEnv();
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying after 3 attempts
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
      lazyConnect: false,
    });

    redis.on('error', (err) => {
      // Suppress noisy ECONNREFUSED spam from retry attempts
      if ((err as any).code !== 'ECONNREFUSED') {
        console.error('Redis error:', err);
      }
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });
  }

  return redis;
}

export async function connectRedis(): Promise<void> {
  try {
    const client = getRedisClient();
    await client.ping();
    console.log('✅ Redis connection verified');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    console.log('Redis disconnected');
  }
}

export { redis };
