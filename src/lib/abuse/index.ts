import { z } from "zod";
import { getRedis } from "@/lib/redis";
import type { AbuseEvent, AbuseScore } from "./types";
import { ABUSE_THRESHOLDS } from "./types";

const ABUSE_KEY_PREFIX = "abuse:";
const abuseEventTypeSchema = z.enum([
  "submission",
  "report",
  "rate_limit_hit",
  "duplicate_submission",
  "invalid_input",
]);
const storedAbuseEventSchema = z.object({
  type: abuseEventTypeSchema,
  timestamp: z.number(),
});

type StoredAbuseEvent = z.infer<typeof storedAbuseEventSchema>;

function parseStoredAbuseEvent(eventValue: string): StoredAbuseEvent | null {
  try {
    const parsed = storedAbuseEventSchema.safeParse(JSON.parse(eventValue));
    return parsed.success ? parsed.data : null;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

function scoreEvents(events: readonly string[]): number {
  return events.reduce((score, eventValue) => {
    const event = parseStoredAbuseEvent(eventValue);
    return event === null ? score : score + ABUSE_THRESHOLDS.increments[event.type];
  }, 0);
}

function toAbuseScore(score: number): AbuseScore {
  const blocked = score >= ABUSE_THRESHOLDS.blockThreshold;

  return {
    score: Math.min(score, 100),
    blocked,
    ...(blocked ? { reason: "Abuse threshold exceeded" } : {}),
    resetsIn: ABUSE_THRESHOLDS.windowMs,
  };
}

/**
 * Record an abuse event and calculate score.
 *
 * @param event - Abuse event to record
 * @returns Current abuse score
 */
export async function recordAbuseEvent(event: AbuseEvent): Promise<AbuseScore> {
  const redis = getRedis();
  const key = `${ABUSE_KEY_PREFIX}${event.sessionHmac}`;
  const now = Date.now();
  const windowStart = now - ABUSE_THRESHOLDS.windowMs;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zadd(key, {
    score: now,
    member: JSON.stringify({ type: event.type, timestamp: event.timestamp }),
  });
  pipeline.zcard(key);
  pipeline.expire(key, Math.ceil(ABUSE_THRESHOLDS.windowMs / 1000));
  await pipeline.exec();

  const events = await redis.zrange<string[]>(key, 0, -1);
  return toAbuseScore(scoreEvents(events));
}

/**
 * Check if a session is currently blocked.
 *
 * @param sessionHmac - Session HMAC to check
 * @returns Whether session is blocked
 */
export async function isSessionBlocked(sessionHmac: string): Promise<boolean> {
  const redis = getRedis();
  const key = `${ABUSE_KEY_PREFIX}${sessionHmac}`;
  const now = Date.now();
  const windowStart = now - ABUSE_THRESHOLDS.windowMs;
  const events = await redis.zrange<string[]>(key, windowStart, now, { byScore: true });

  return scoreEvents(events) >= ABUSE_THRESHOLDS.blockThreshold;
}

/**
 * Get abuse score for a session.
 *
 * @param sessionHmac - Session HMAC
 * @returns Abuse score
 */
export async function getAbuseScore(sessionHmac: string): Promise<AbuseScore> {
  const redis = getRedis();
  const key = `${ABUSE_KEY_PREFIX}${sessionHmac}`;
  const now = Date.now();
  const windowStart = now - ABUSE_THRESHOLDS.windowMs;
  const events = await redis.zrange<string[]>(key, windowStart, now, { byScore: true });

  return toAbuseScore(scoreEvents(events));
}

/**
 * Reset abuse score for a session.
 *
 * @param sessionHmac - Session HMAC to reset
 */
export async function resetAbuseScore(sessionHmac: string): Promise<void> {
  const redis = getRedis();
  const key = `${ABUSE_KEY_PREFIX}${sessionHmac}`;
  await redis.del(key);
}

export type { AbuseEvent, AbuseEventType, AbuseScore } from "./types";
export { ABUSE_THRESHOLDS } from "./types";
