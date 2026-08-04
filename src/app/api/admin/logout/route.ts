import { type NextRequest, NextResponse } from "next/server";
import {
  AUTH_CONFIG,
  deleteAdminSession,
  getTokenFromCookie,
  validateAdminSession,
} from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = getTokenFromCookie(request.headers.get("cookie"));

  if (token) {
    const session = await validateAdminSession(token);
    if (session) {
      await deleteAdminSession(session.id);
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_CONFIG.cookieName);
  response.cookies.delete(AUTH_CONFIG.csrfCookieName);

  return response;
}
