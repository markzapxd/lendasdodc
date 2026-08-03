import { Redis } from "@upstash/redis";
import { serverEnv } from "@/lib/env/server";

let redis: Redis | null = null;

/**
 * Upstash Redis connection singleton.
 * Uses REST-based protocol and is safe for serverless runtimes.
 *
 * SECURITY: This module must only be imported in server-side code.
 */
export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: serverEnv.UPSTASH_REDIS_REST_URL,
      token: serverEnv.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redis;
}

export type { LockOptions } from "./lock";
export { acquireLock, releaseLock, withLock } from "./lock";
export type { QueueItem, QueueStats } from "./queue";
export { completeQueueItem, dequeueSubmissions, enqueueSubmission, getQueueStats } from "./queue";
export type { RateLimitConfig, RateLimitResult } from "./rate-limit";
export { checkRateLimit, RATE_LIMITS } from "./rate-limit";
