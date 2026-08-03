import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/redis";

export interface RateLimitConfig {
  readonly windowMs: number;
  readonly maxRequests: number;
  readonly keyGenerator?: (request: NextRequest) => string;
}

/**
 * Rate limiting middleware for API routes.
 *
 * Uses the existing atomic Redis sliding-window implementation so route
 * middleware shares the same serverless-safe Redis client and key semantics.
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
    const identifier = config.keyGenerator?.(request) ?? defaultKeyGenerator(request);
    const rateLimit = await checkRateLimit(identifier, {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyPrefix: "rl:middleware",
    });

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    return null;
  };
}

function defaultKeyGenerator(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${forwardedFor || "unknown"}:${request.nextUrl.pathname}`;
}

/**
 * Pre-configured rate limits.
 */
export const API_RATE_LIMITS = {
  submission: {
    windowMs: 60 * 1000,
    maxRequests: 5,
  },
  report: {
    windowMs: 60 * 1000,
    maxRequests: 3,
  },
  admin: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  },
} as const;
