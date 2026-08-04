import { z } from "zod";
import { asCardId, asMessageId } from "@/lib/ids";
import type { Card, Message } from "@/types/database";

const cardRowSchema = z.object({
  id: z.guid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  image_url: z.string().url().nullable(),
  image_alt: z.string().nullable(),
  status: z.enum(["active", "archived", "hidden", "deleted"]),
  message_count: z.number().int().nonnegative(),
  last_activity_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

const cardMetadataSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
});

const messageRowSchema = z.object({
  id: z.string().uuid(),
  card_id: z.string().uuid(),
  content: z.string().nullable(),
  nickname: z.string().nullable(),
  status: z.enum(["published", "removed"]),
  published_at: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export function parsePublicCard(row: unknown): Card {
  const parsed = cardRowSchema.parse(row);
  return {
    ...parsed,
    id: asCardId(parsed.id),
  };
}

export function parsePublicCardMetadata(row: unknown): Pick<Card, "name" | "description"> {
  return cardMetadataSchema.parse(row);
}

export function parsePublicMessage(row: unknown): Message {
  const parsed = messageRowSchema.parse(row);
  return {
    ...parsed,
    id: asMessageId(parsed.id),
    card_id: asCardId(parsed.card_id),
  };
}
