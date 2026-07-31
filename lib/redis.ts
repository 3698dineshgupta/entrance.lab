import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export default redis;

/**
 * A helper function to fetch data with a fallback to the database.
 * If Redis is unavailable or the cache misses, it fetches from DB and caches it.
 * 
 * @param key The Redis cache key
 * @param fetcher Function that fetches data from the database
 * @param ttl Time to live in seconds (default 300s = 5m)
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  try {
    const cached = await redis.get<T>(key);
    if (cached) {
      console.log(`[Redis] Cache Hit: ${key}`);
      return cached;
    }
  } catch (error) {
    console.error(`[Redis] Error reading cache for ${key}:`, error);
  }

  console.log(`[Redis] Cache Miss: ${key} - Fetching from DB...`);
  const data = await fetcher();

  if (data !== undefined && data !== null) {
    try {
      await redis.setex(key, ttl, data);
    } catch (error) {
      console.error(`[Redis] Error setting cache for ${key}:`, error);
    }
  }

  return data;
}

/**
 * Helper to invalidate a cache key
 */
export async function invalidateCache(key: string) {
  try {
    await redis.del(key);
    console.log(`[Redis] Invalidated cache: ${key}`);
  } catch (error) {
    console.error(`[Redis] Error invalidating cache for ${key}:`, error);
  }
}
