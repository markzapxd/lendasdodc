"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { handleSubmit } from "@/lib/queue/submit";
import type { SubmissionResult } from "@/lib/queue/types";
import { createSession } from "@/lib/session";
import { SESSION_CONFIG } from "@/lib/session/types";
import { processSubmissions } from "@/lib/worker/publisher";

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

  const result = await handleSubmit({
    cardId,
    content,
    sessionToken,
    idempotencyKey,
    ip,
  });

  if (result.success) {
    try {
      await processSubmissions(cardId);
      revalidatePath("/");
    } catch (err) {
      console.error("Erro ao processar submissões:", err);
    }
  }

  return result;
}
