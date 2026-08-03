"use client";

import { createBrowserClient } from "@/lib/supabase";
import { parsePublicMessage } from "@/lib/supabase/public-content";
import type { Message } from "@/types/database";
import type { RealtimeEventType, RealtimeMessageEvent, RealtimeOptions } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseMessage(value: unknown): Message | null {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    return null;
  }

  return parsePublicMessage(value);
}

/**
 * Subscribe to real-time message updates.
 *
 * @param options - Subscription options
 * @returns Unsubscribe function
 */
export function subscribeToMessages(options: RealtimeOptions): () => void {
  const supabase = createBrowserClient();
  const messageChanges = {
    event: "*" as const,
    schema: "api" as const,
    table: "messages" as const,
    ...(options.cardId ? { filter: `card_id=eq.${options.cardId}` } : {}),
  };

  const channel = supabase
    .channel("messages")
    .on("postgres_changes", messageChanges, (payload) => {
      try {
        const event: RealtimeMessageEvent = {
          type: payload.eventType as RealtimeEventType,
          new: parseMessage(payload.new),
          old: parseMessage(payload.old),
        };

        options.onMessage(event);
      } catch (error) {
        options.onError?.(
          error instanceof Error ? error : new Error("Invalid real-time message payload"),
        );
      }
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("Subscribed to real-time messages");
      } else if (status === "CHANNEL_ERROR") {
        options.onError?.(new Error("Real-time subscription failed"));
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to platform state updates.
 *
 * @param callback - Callback for state changes
 * @returns Unsubscribe function
 */
export function subscribeToPlatformState(
  callback: (state: Record<string, unknown>) => void,
): () => void {
  const supabase = createBrowserClient();

  const channel = supabase
    .channel("platform_state")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "api",
        table: "platform_state",
      },
      (payload) => {
        if (isRecord(payload.new)) {
          callback(payload.new);
        }
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
