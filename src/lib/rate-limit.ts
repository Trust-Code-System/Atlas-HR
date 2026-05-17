import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback when Upstash is not configured (dev environments)
const _memStore = new Map<string, { count: number; resetAt: number }>();

function memoryCheck(
  key: string,
  limit: number,
  windowSeconds: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = _memStore.get(key);
  if (!entry || entry.resetAt <= now) {
    _memStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) return { allowed: false, remaining: 0 };
  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

let _redis: Redis | null = null;
const _limiters = new Map<string, Ratelimit>();

function getRedis(): Redis {
  _redis ??= new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return _redis;
}

function getRatelimit(limit: number, windowSeconds: number): Ratelimit {
  const cacheKey = `${limit}:${windowSeconds}`;
  if (!_limiters.has(cacheKey)) {
    _limiters.set(
      cacheKey,
      new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      })
    );
  }
  return _limiters.get(cacheKey)!;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return memoryCheck(key, limit, windowSeconds);
  }

  try {
    const rl = getRatelimit(limit, windowSeconds);
    const { success, remaining } = await rl.limit(key);
    return { allowed: success, remaining };
  } catch {
    // Upstash unavailable — degrade gracefully to in-memory
    return memoryCheck(key, limit, windowSeconds);
  }
}
