import { createHmac, randomBytes } from "node:crypto";
import { checkRateLimit, RATE_LIMITS } from "@/lib/redis";
import type { AnonymousSession } from "./types";
import { SESSION_CONFIG } from "./types";

const { SESSION_HMAC_SECRET: sessionSecret } = process.env;
const SESSION_SECRET = sessionSecret || "";
const SESSION_ID_PATTERN = /^[0-9a-f]{64}$/;

/**
 * Create a new anonymous session.
 *
 * @returns New anonymous session
 */
export function createSession(): AnonymousSession {
  const sessionId = randomBytes(32).toString("hex");
  const sessionHmac = createHmac("sha256", SESSION_SECRET).update(sessionId).digest("hex");
  const now = Date.now();

  return {
    sessionHmac,
    sessionId,
    createdAt: now,
    expiresAt: now + SESSION_CONFIG.maxAge * 1000,
    rateLimit: {
      remaining: RATE_LIMITS.submission.maxRequests,
      resetAt: now + RATE_LIMITS.submission.windowMs,
    },
  };
}

/**
 * Validate a session from cookie value.
 *
 * @param cookieValue - Raw session ID from cookie
 * @returns Valid session or null if invalid/expired
 */
export async function validateSession(cookieValue: string): Promise<AnonymousSession | null> {
  if (!cookieValue || !SESSION_ID_PATTERN.test(cookieValue)) {
    return null;
  }

  const expectedHmac = createHmac("sha256", SESSION_SECRET).update(cookieValue).digest("hex");
  const rateLimit = await checkRateLimit(expectedHmac, RATE_LIMITS.submission);
  const now = Date.now();

  return {
    sessionHmac: expectedHmac,
    sessionId: cookieValue,
    createdAt: now,
    expiresAt: now + SESSION_CONFIG.maxAge * 1000,
    rateLimit: {
      remaining: rateLimit.remaining,
      resetAt: rateLimit.resetAt,
    },
  };
}

/**
 * Get session HMAC for storage in queue items.
 *
 * @param sessionId - Raw session ID
 * @returns HMAC of session ID
 */
export function getSessionHmac(sessionId: string): string {
  return createHmac("sha256", SESSION_SECRET).update(sessionId).digest("hex");
}

/**
 * Check if session is expired.
 *
 * @param session - Session to check
 * @returns Whether session is expired
 */
export function isSessionExpired(session: AnonymousSession): boolean {
  return Date.now() > session.expiresAt;
}

export type { AnonymousSession } from "./types";
export { SESSION_CONFIG } from "./types";
