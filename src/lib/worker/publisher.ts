import { recordAuditEvent } from "@/lib/audit";
import { completeQueueItem, dequeueSubmissions } from "@/lib/redis";
import { createAdminClient } from "@/lib/supabase";

/**
 * Process pending submissions from the queue.
 * Implements fair ordering by processing oldest items first.
 *
 * @param cardId - Card to process submissions for
 * @param limit - Max items to process per batch
 * @returns Number of items processed
 */
export async function processSubmissions(cardId: string, limit = 10): Promise<number> {
  const supabase = createAdminClient();
  const items = await dequeueSubmissions(cardId, limit);
  let processed = 0;

  for (const item of items) {
    try {
      const { error } = await supabase
        .schema("api")
        .from("messages")
        .insert({
          card_id: item.cardId,
          content: item.content ?? item.contentHash,
          status: "published",
          published_at: new Date().toISOString(),
        });

      if (error) {
        console.error(`Failed to publish message: ${error.message}`);
        await completeQueueItem(cardId, item, "failed");

        await recordAuditEvent({
          actorId: "system",
          action: "system_error",
          entityType: "message",
          entityId: item.id,
          context: { error: error.message },
          timestamp: Date.now(),
        });

        continue;
      }

      await completeQueueItem(cardId, item, "published");
      processed++;
    } catch (error) {
      console.error(`Error processing item ${item.id}:`, error);
      await completeQueueItem(cardId, item, "failed");
    }
  }

  return processed;
}

/**
 * Process all cards' queues.
 *
 * @returns Total items processed across all cards
 */
export async function processAllQueues(): Promise<number> {
  const supabase = createAdminClient();
  const { data: cards, error } = await supabase.from("cards").select("id").eq("status", "active");

  if (error || !cards) {
    console.error("Failed to fetch cards:", error);
    return 0;
  }

  let totalProcessed = 0;
  for (const card of cards) {
    if (typeof card.id === "string") {
      totalProcessed += await processSubmissions(card.id);
    }
  }

  return totalProcessed;
}
