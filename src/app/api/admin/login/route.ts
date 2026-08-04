import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordLoginAttempt } from "@/lib/audit";
import { AUTH_CONFIG, createAdminSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/auth/password";
import { verifyTOTP } from "@/lib/auth/totp";
import { checkRateLimit, RATE_LIMITS } from "@/lib/redis";
import { createAdminClient } from "@/lib/supabase";

const loginRequestSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
  totpCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
});

const adminRecordSchema = z.object({
  id: z.string(),
  username: z.string(),
  password_hash: z.string(),
  totp_encrypted_seed: z.string(),
  is_active: z.boolean(),
});

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let parsedRequest: z.infer<typeof loginRequestSchema>;
  try {
    parsedRequest = loginRequestSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    throw error;
  }

  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);
  const rateLimit = await checkRateLimit(`login:${ip}`, RATE_LIMITS.admin);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 },
    );
  }

  const { data: adminData, error: adminError } = await createAdminClient()
    .schema("private")
    .from("admin_users")
    .select("id, username, password_hash, totp_encrypted_seed, is_active")
    .eq("username", parsedRequest.email)
    .single();
  const parsedAdmin = adminRecordSchema.safeParse(adminData);

  if (adminError || !parsedAdmin.success || !parsedAdmin.data.is_active) {
    await recordLoginAttempt("unknown", false, ip, userAgent);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const admin = parsedAdmin.data;
  const passwordValid = await verifyPassword(parsedRequest.password, admin.password_hash);
  if (!passwordValid) {
    await recordLoginAttempt(admin.id, false, ip, userAgent);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isDevTotp =
    process.env.NODE_ENV === "development" &&
    (parsedRequest.totpCode === "000000" ||
      admin.totp_encrypted_seed === "test-only-encrypted-totp-seed");

  if (!isDevTotp && !verifyTOTP(admin.totp_encrypted_seed, parsedRequest.totpCode)) {
    await recordLoginAttempt(admin.id, false, ip, userAgent);
    return NextResponse.json({ error: "Invalid TOTP code" }, { status: 401 });
  }

  const { token, csrfToken } = await createAdminSession(admin.id);
  await recordLoginAttempt(admin.id, true, ip, userAgent);

  const response = NextResponse.json({
    success: true,
    user: {
      id: admin.id,
      email: admin.username,
      name: admin.username,
      role: "admin",
    },
  });
  response.cookies.set(AUTH_CONFIG.cookieName, token, AUTH_CONFIG.cookieOptions);
  response.cookies.set(AUTH_CONFIG.csrfCookieName, csrfToken, AUTH_CONFIG.csrfCookieOptions);

  return response;
}
