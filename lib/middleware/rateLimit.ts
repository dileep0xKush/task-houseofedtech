import { NextRequest, NextResponse } from "next/server";

const requestMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown";
  const key = `${ip}`;

  const now = Date.now();
  let data = requestMap.get(key);

  if (!data || now > data.resetTime) {
    data = { count: 0, resetTime: now + windowMs };
    requestMap.set(key, data);
  }

  data.count++;

  if (data.count > limit) {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMIT_EXCEEDED" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((data.resetTime - now) / 1000)),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(Math.max(0, limit - data.count)),
          "X-RateLimit-Reset": String(data.resetTime),
        },
      }
    );
  }

  // Clean up old entries
  if (requestMap.size > 10000) {
    for (const [key, value] of requestMap.entries()) {
      if (now > value.resetTime) {
        requestMap.delete(key);
      }
    }
  }

  return null; // No rate limit exceeded
}
