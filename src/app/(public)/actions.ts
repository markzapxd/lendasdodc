"use server";

import { headers, cookies } from "next/headers";
import { handleSubmit } from "@/lib/queue/submit";
import { createSession } from "@/lib/session";
import { SESSION_CONFIG } from "@/lib/session/types";
import type { SubmissionResult } from "@/lib/queue/types";

export async function submitMessageAction(
  cardId: string,
  content: string,
  idempotencyKey: string,
): Promise<SubmissionResult> {
  const reqHeaders = await headers();
  // Using typical headers for IP, default to unknown
  const ip = reqHeaders.get("x-forwarded-for") ?? reqHeaders.get("x-real-ip") ?? "unknown";
  
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_CONFIG.name);
  let sessionToken = sessionCookie?.value ?? "";

  if (!sessionToken) {
    const newSession = createSession();
    sessionToken = newSession.sessionId;
    cookieStore.set({
      name: SESSION_CONFIG.name,
      value: newSession.sessionId,
      ...SESSION_CONFIG.options,
    });
  }

  return handleSubmit({
    cardId,
    content,
    sessionToken,
    idempotencyKey,
    ip,
  });
}
