import { getRedis } from "./index";

export type RateLimitConfig = {
  readonly windowMs: number;
  readonly maxRequests: number;
  readonly keyPrefix: string;
};

export type GlobalPanicConfig = RateLimitConfig & {
  readonly lockoutSeconds: number;
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

const GLOBAL_PANIC_SCRIPT = `
  local lockout_key = KEYS[1]
  local window_key = KEYS[2]
  local now = tonumber(ARGV[1])
  local window_start = tonumber(ARGV[2])
  local max_requests = tonumber(ARGV[3])
  local member = ARGV[4]
  local lockout_ttl = tonumber(ARGV[5])
  local window_ttl = tonumber(ARGV[6])

  if redis.call("EXISTS", lockout_key) == 1 then
    return { 0, redis.call("TTL", lockout_key) }
  end

  redis.call("ZREMRANGEBYSCORE", window_key, 0, window_start)
  redis.call("ZADD", window_key, now, member)
  local count = redis.call("ZCARD", window_key)
  redis.call("EXPIRE", window_key, window_ttl)

  if count > max_requests then
    redis.call("SET", lockout_key, "1", "EX", lockout_ttl)
    return { 0, lockout_ttl }
  end

  return { 1, 0 }
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

export async function checkGlobalPanic(
  config: GlobalPanicConfig,
): Promise<{ readonly allowed: boolean; readonly lockoutRemainingSeconds: number }> {
  const redis = getRedis();
  const lockoutKey = `${config.keyPrefix}:lockout`;
  const windowKey = `${config.keyPrefix}:window`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const result = await redis.eval<string[], readonly [number, number]>(
    GLOBAL_PANIC_SCRIPT,
    [lockoutKey, windowKey],
    [
      String(now),
      String(windowStart),
      String(config.maxRequests),
      crypto.randomUUID(),
      String(config.lockoutSeconds),
      String(Math.ceil(config.windowMs / 1000)),
    ],
  );

  const [allowed, ttl] = result;

  return {
    allowed: allowed === 1,
    lockoutRemainingSeconds: ttl,
  };
}

export const RATE_LIMITS = {
  globalPanic: {
    windowMs: 10 * 60 * 1000,
    maxRequests: 100,
    lockoutSeconds: 60 * 60,
    keyPrefix: "rl:panic",
  },
  ipSubmission: {
    windowMs: 60 * 1000,
    maxRequests: 5,
    keyPrefix: "rl:submit_ip",
  },
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
