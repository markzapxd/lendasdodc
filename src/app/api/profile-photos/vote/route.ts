import { NextResponse } from "next/server";
import { castProfilePhotoVote } from "@/lib/profile-photos";
import { checkRateLimit } from "@/lib/redis";
import { createSession, getSessionHmac } from "@/lib/session";
import { SESSION_CONFIG } from "@/lib/session/types";

const voteRequestSchema =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    !("cardId" in body) ||
    !("photoId" in body) ||
    typeof body.cardId !== "string" ||
    typeof body.photoId !== "string" ||
    !voteRequestSchema.test(body.cardId) ||
    !voteRequestSchema.test(body.photoId)
  ) {
    return NextResponse.json({ success: false, error: "Voto inválido." }, { status: 400 });
  }

  let sessionToken = request.headers
    .get("cookie")
    ?.match(new RegExp(`(?:^|;\\s*)${SESSION_CONFIG.name}=([^;]+)`))?.[1];
  let newSessionToken: string | null = null;
  if (!sessionToken) {
    newSessionToken = createSession().sessionId;
    sessionToken = newSessionToken;
  }

  const sessionHmac = getSessionHmac(sessionToken);
  const rateLimit = await checkRateLimit(sessionHmac, {
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: "rl:profile_vote",
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "Aguarde um minuto antes de votar novamente." },
      { status: 429 },
    );
  }

  try {
    await castProfilePhotoVote(body.cardId, body.photoId, sessionHmac);
    const response = NextResponse.json({ success: true });
    if (newSessionToken)
      response.cookies.set(SESSION_CONFIG.name, newSessionToken, SESSION_CONFIG.options);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Não foi possível registrar o voto.",
      },
      { status: 400 },
    );
  }
}
