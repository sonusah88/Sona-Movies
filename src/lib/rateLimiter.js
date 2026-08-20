// src/lib/rateLimiter.js
// Token-bucket rate limiter - 60 requests per minute per IP.
// Pure in-memory; works on Netlify Functions.

const buckets = new Map();
const RATE_LIMIT = 60;
const WINDOW_MS = 60 * 1000;

function getClientIp(event) {
  return (
    event.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    event.headers?.["x-real-ip"] ||
    "0.0.0.0"
  );
}

function getTokens(ip) {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now - bucket.lastRefill >= WINDOW_MS) {
    const fresh = { tokens: RATE_LIMIT - 1, lastRefill: now };
    buckets.set(ip, fresh);
    return { allowed: true, remaining: fresh.tokens };
  }
  if (bucket.tokens <= 0) {
    const retryAfter = Math.ceil((bucket.lastRefill + WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }
  bucket.tokens -= 1;
  return { allowed: true, remaining: bucket.tokens };
}

export function withRateLimit(handler) {
  return async function (event, context) {
    const ip = getClientIp(event);
    const { allowed, remaining, retryAfter } = getTokens(ip);
    if (!allowed) {
      return {
        statusCode: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
        },
        body: JSON.stringify({ error: "Too Many Requests", message: `Rate limit exceeded. Try again in ${retryAfter}s.` }),
      };
    }
    const response = await handler(event, context);
    if (response?.headers) {
      response.headers["X-RateLimit-Limit"] = String(RATE_LIMIT);
      response.headers["X-RateLimit-Remaining"] = String(remaining);
    }
    return response;
  };
}

// Standard SWR Cache-Control header. Edge CDN caches 24h; stale served 7 days while revalidating.
export const SWR_CACHE_HEADER = "public, s-maxage=86400, stale-while-revalidate=604800";
