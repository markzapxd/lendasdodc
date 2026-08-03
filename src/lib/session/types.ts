/**
 * Anonymous session for unauthenticated submissions.
 * No personal data is stored - only cryptographic identifiers.
 */
export interface AnonymousSession {
  /** HMAC of session identifier (privacy-preserving) */
  readonly sessionHmac: string;
  /** Raw session ID (stored in cookie, never in DB) */
  readonly sessionId: string;
  /** Session creation timestamp */
  readonly createdAt: number;
  /** Session expiry timestamp */
  readonly expiresAt: number;
  /** Rate limit state */
  readonly rateLimit: {
    readonly remaining: number;
    readonly resetAt: number;
  };
}

/**
 * Session cookie configuration.
 */
export const SESSION_CONFIG = {
  /** Cookie name */
  name: "_ldc_session",
  /** Session duration (24 hours) */
  maxAge: 24 * 60 * 60,
  /** Cookie options */
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
} as const;
