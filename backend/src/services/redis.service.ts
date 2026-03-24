import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, enableOfflineQueue: false });
    redis.on('error', (err) => console.warn('Redis error (non-fatal):', err.message));
  }
  return redis;
}

export async function setOnline(userId: string): Promise<void> {
  const r = getRedis();
  if (r) await r.set(`online:${userId}`, '1', 'EX', 300).catch(() => {});
}

export async function setOffline(userId: string): Promise<void> {
  const r = getRedis();
  if (r) await r.del(`online:${userId}`).catch(() => {});
}

export async function isOnline(userId: string): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  const val = await r.get(`online:${userId}`).catch(() => null);
  return val === '1';
}
