import { getRedis } from "./index";

export type RateLimitConfig = {
  readonly windowMs: number;
  readonly maxRequests: number;
  readonly keyPrefix: string;
};

export type RateLimitResult = {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: number;
};

const RATE_LIMIT_SCRIPT = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local window_start = tonumber(ARGV[2])
  local max_requests = tonumber(ARGV[3])
  local member = ARGV[4]
  local ttl_seconds = tonumber(ARGV[5])

  redis.call("ZREMRANGEBYSCORE", key, 0, window_start)
  redis.call("ZADD", key, now, member)
  local count = redis.call("ZCARD", key)
  redis.call("EXPIRE", key, ttl_seconds)

  if count <= max_requests then
    return { 1, count }
  end

  return { 0, count }
`;

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const redis = getRedis();
  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const countResult = await redis.eval<string[], readonly [number, number]>(
    RATE_LIMIT_SCRIPT,
    [key],
    [
      String(now),
      String(windowStart),
      String(config.maxRequests),
      crypto.randomUUID(),
      String(Math.ceil(config.windowMs / 1000)),
    ],
  );
  const [allowed, count] = countResult;

  return {
    allowed: allowed === 1,
    remaining: Math.max(0, config.maxRequests - count),
    resetAt: now + config.windowMs,
  };
}

export const RATE_LIMITS = {
  submission: {
    windowMs: 60 * 1000,
    maxRequests: 5,
    keyPrefix: "rl:submit",
  },
  report: {
    windowMs: 60 * 1000,
    maxRequests: 3,
    keyPrefix: "rl:report",
  },
  admin: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    keyPrefix: "rl:admin",
  },
} as const;
