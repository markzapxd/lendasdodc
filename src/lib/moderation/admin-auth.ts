import { createHmac, timingSafeEqual } from "node:crypto";
import { getTokenFromCookie, validateAdminSession } from "@/lib/auth";
import { serverEnv } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase";

export type AuthorizedAdmin = {
  readonly adminId: string;
  readonly csrfRequired: boolean;
};

function isCsrfRecord(value: unknown): value is { readonly csrf_token_hash: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "csrf_token_hash" in value &&
    typeof value.csrf_token_hash === "string"
  );
}

function hashToken(token: string): string {
  return createHmac("sha256", serverEnv.ADMIN_SESSION_SECRET).update(token).digest("hex");
}

function hashesEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function requireAdmin(
  request: Request,
  requireCsrf = false,
): Promise<AuthorizedAdmin> {
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
  const cookieToken = getTokenFromCookie(request.headers.get("cookie"));
  const sessionToken = bearerToken || cookieToken;

  if (!sessionToken) {
    throw new Error("Unauthorized");
  }

  const session = await validateAdminSession(sessionToken);
  if (!session) {
    throw new Error("Unauthorized");
  }

  if (requireCsrf && cookieToken && !bearerToken) {
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken) {
      throw new Error("Forbidden");
    }

    const { data, error } = await createAdminClient()
      .from("admin_sessions")
      .select("csrf_token_hash")
      .eq("id", session.id)
      .single();
    if (error || !isCsrfRecord(data) || !hashesEqual(hashToken(csrfToken), data.csrf_token_hash)) {
      throw new Error("Forbidden");
    }
  }

  return { adminId: session.adminUserId, csrfRequired: Boolean(cookieToken && !bearerToken) };
}
