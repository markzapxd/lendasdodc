import type { Message } from "@/types/database";

/**
 * Real-time event types.
 */
export type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE";

/**
 * Real-time message event.
 */
export interface RealtimeMessageEvent {
  readonly type: RealtimeEventType;
  readonly new: Message | null;
  readonly old: Message | null;
}

/**
 * Real-time subscription options.
 */
export interface RealtimeOptions {
  /** Card ID to filter by */
  readonly cardId?: string;
  /** Callback for new events */
  readonly onMessage: (event: RealtimeMessageEvent) => void;
  /** Callback for errors */
  readonly onError?: (error: Error) => void;
}
