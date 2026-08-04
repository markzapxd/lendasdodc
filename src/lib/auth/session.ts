import { createHmac, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase";
import type { AdminSession } from "./types";
import { AUTH_CONFIG } from "./types";

const { ADMIN_SESSION_SECRET: sessionSecret } = process.env;
const SESSION_SECRET = sessionSecret ?? "";

function hashToken(token: string): string {
  return createHmac("sha256", SESSION_SECRET).update(token).digest("hex");
}

function toAdminSession(data: {
  readonly id: string;
  readonly admin_id: string;
  readonly session_token_hash: string;
  readonly expires_at: string;
  readonly created_at: string;
}): AdminSession {
  return {
    id: data.id,
    adminUserId: data.admin_id,
    tokenHash: data.session_token_hash,
    expiresAt: new Date(data.expires_at),
    createdAt: new Date(data.created_at),
  };
}

/**
 * Create a new admin session.
 *
 * @param adminUserId - Admin user ID
 * @returns Session with token
 */
export async function createAdminSession(
  adminUserId: string,
): Promise<{ readonly session: AdminSession; readonly token: string; readonly csrfToken: string }> {
  const supabase = createAdminClient();
  const token = randomBytes(32).toString("hex");
  const csrfToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const csrfTokenHash = hashToken(csrfToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + AUTH_CONFIG.sessionDurationMs);

  const { data, error } = await supabase
    .schema("private")
    .from("admin_sessions")
    .insert({
      admin_id: adminUserId,
      session_token_hash: tokenHash,
      csrf_token_hash: csrfTokenHash,
      password_assured_at: now.toISOString(),
      totp_assured_at: now.toISOString(),
      status: "active",
      expires_at: expiresAt.toISOString(),
    })
    .select("id, admin_id, session_token_hash, expires_at, created_at")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create session: ${error?.message ?? "unknown database error"}`);
  }

  return { session: toAdminSession(data), token, csrfToken };
}

/**
 * Validate an admin session token.
 *
 * @param token - Session token
 * @returns Valid session or null
 */
export async function validateAdminSession(token: string): Promise<AdminSession | null> {
  if (!token) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .schema("private")
    .from("admin_sessions")
    .select("id, admin_id, session_token_hash, expires_at, created_at")
    .eq("session_token_hash", hashToken(token))
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) return null;

  return toAdminSession(data);
}

/**
 * Delete an admin session (logout).
 *
 * @param sessionId - Session ID
 */
export async function deleteAdminSession(sessionId: string): Promise<void> {
  await createAdminClient().schema("private").from("admin_sessions").delete().eq("id", sessionId);
}

/**
 * Get session token from cookie header.
 *
 * @param cookieHeader - Cookie header string
 * @returns Session token or null
 */
export function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const sessionPrefix = `${AUTH_CONFIG.cookieName}=`;
  const sessionCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(sessionPrefix));

  return sessionCookie?.slice(sessionPrefix.length) || null;
}
