import redis from "@/lib/redis";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

// Fixed-window rate limiter backed by the same Upstash Redis instance
// already used for caching. Fails OPEN (allows the request) if Redis is
// unreachable — matches fetchWithCache's existing fail-open behavior, so a
// Redis outage degrades to "no rate limiting" rather than locking every
// user out of login/registration.
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  try {
    const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
    const redisKey = `ratelimit:${key}:${bucket}`;
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, windowSeconds);
    }
    const resetAt = (bucket + 1) * windowSeconds * 1000;
    return { success: count <= limit, remaining: Math.max(0, limit - count), resetAt };
  } catch (error) {
    console.error("[RateLimit] Error, failing open:", error);
    return { success: true, remaining: limit, resetAt: Date.now() + windowSeconds * 1000 };
  }
}

// Best-effort client IP extraction behind Vercel's proxy.
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitResponse(result: RateLimitResult) {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)).toString(),
      },
    }
  );
}
