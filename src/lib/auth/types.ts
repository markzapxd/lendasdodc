/**
 * Admin user.
 */
export interface AdminUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: "admin" | "moderator";
}

/**
 * Admin session.
 */
export interface AdminSession {
  readonly id: string;
  readonly adminUserId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
}

/**
 * Login request.
 */
export interface LoginRequest {
  readonly email: string;
  readonly password: string;
  readonly totpCode: string;
}

/**
 * Login response.
 */
export interface LoginResponse {
  readonly success: boolean;
  readonly session?: AdminSession;
  readonly error?: string;
}

/**
 * Auth configuration.
 */
export const AUTH_CONFIG = {
  /** Session duration (8 hours) */
  sessionDurationMs: 8 * 60 * 60 * 1000,
  /** Maximum login attempts before lockout */
  maxLoginAttempts: 5,
  /** Lockout duration (15 minutes) */
  lockoutDurationMs: 15 * 60 * 1000,
  /** Cookie name */
  cookieName: "_ldc_admin_session",
  /** Cookie options */
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
} as const;
