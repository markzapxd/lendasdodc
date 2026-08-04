import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import { parsePublicCard } from "@/lib/supabase/public-content";
import type { Card, CardStatus } from "@/types/database";
import { recordCardAuditEvent } from "./card-audit";

const cardFields = {
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).nullable(),
  image_url: z.string().url().nullable(),
  image_alt: z.string().trim().max(200).nullable(),
} as const;

export const cardWriteSchema = z.object(cardFields).strict();
export type CardWriteInput = z.infer<typeof cardWriteSchema>;

const cardFieldsSelection =
  "id, name, slug, description, image_url, image_alt, status, message_count, last_activity_at, created_at, updated_at";

const mutableCardStatuses = ["active", "archived"] as const;
type MutableCardStatus = (typeof mutableCardStatuses)[number];

function cardStatusAction(status: MutableCardStatus): "card.archive" | "card.restore" {
  return status === "archived" ? "card.archive" : "card.restore";
}

export async function getCards(): Promise<readonly Card[]> {
  const { data, error } = await createAdminClient()
    .schema("api")
    .from("cards")
    .select(cardFieldsSelection)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch cards: ${error.message}`, { cause: error });
  }

  return (data ?? []).map(parsePublicCard);
}

export async function createCard(input: CardWriteInput, adminId: string): Promise<Card> {
  const { data, error } = await createAdminClient()
    .schema("api")
    .from("cards")
    .insert({ ...input, status: "active" })
    .select(cardFieldsSelection)
    .single();

  if (error || !data) {
    throw new Error(`Failed to create card: ${error?.message ?? "no card returned"}`, {
      cause: error,
    });
  }

  const card = parsePublicCard(data);
  await recordCardAuditEvent({
    adminId,
    action: "card.create",
    cardId: card.id,
    newValues: input,
  });
  return card;
}

export async function updateCard(
  cardId: string,
  input: CardWriteInput,
  adminId: string,
): Promise<Card> {
  const { data, error } = await createAdminClient()
    .schema("api")
    .from("cards")
    .update(input)
    .eq("id", cardId)
    .select(cardFieldsSelection)
    .single();

  if (error || !data) {
    throw new Error(`Failed to update card: ${error?.message ?? "card not found"}`, {
      cause: error,
    });
  }

  const card = parsePublicCard(data);
  await recordCardAuditEvent({
    adminId,
    action: "card.update",
    cardId,
    newValues: input,
  });
  return card;
}

export async function setCardStatus(
  cardId: string,
  status: MutableCardStatus,
  adminId: string,
): Promise<Card> {
  const { data, error } = await createAdminClient()
    .schema("api")
    .from("cards")
    .update({ status })
    .eq("id", cardId)
    .select(cardFieldsSelection)
    .single();

  if (error || !data) {
    throw new Error(`Failed to change card status: ${error?.message ?? "card not found"}`, {
      cause: error,
    });
  }

  const card = parsePublicCard(data);
  await recordCardAuditEvent({
    adminId,
    action: cardStatusAction(status),
    cardId,
    newValues: { status },
  });
  return card;
}

export function isMutableCardStatus(status: CardStatus): status is MutableCardStatus {
  return status === "active" || status === "archived";
}

export { cardFieldsSelection };
