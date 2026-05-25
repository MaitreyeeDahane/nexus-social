import { NextRequest } from "next/server";

// Simple in-memory rate limiter (use Redis in production)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  default: { windowMs: 60 * 1000, maxRequests: 60 },
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  vote: { windowMs: 60 * 1000, maxRequests: 30 },
  post: { windowMs: 60 * 1000, maxRequests: 10 },
  comment: { windowMs: 60 * 1000, maxRequests: 20 },
  search: { windowMs: 60 * 1000, maxRequests: 30 },
  upload: { windowMs: 60 * 60 * 1000, maxRequests: 20 },
};

export function checkRateLimit(
  identifier: string,
  action: keyof typeof RATE_LIMIT_CONFIGS = "default"
): { success: boolean; limit: number; remaining: number; reset: number } {
  const config = RATE_LIMIT_CONFIGS[action] || RATE_LIMIT_CONFIGS.default;
  const now = Date.now();
  const key = `${action}:${identifier}`;

  const record = rateLimit.get(key);

  if (!record || now > record.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + config.windowMs });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: now + config.windowMs,
    };
  }

  if (record.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: record.resetTime,
    };
  }

  record.count++;
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - record.count,
    reset: record.resetTime,
  };
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous"
  );
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  rateLimit.forEach((value, key) => {
    if (now > value.resetTime) {
      rateLimit.delete(key);
    }
  });
}, 5 * 60 * 1000);
