"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeToMessages } from "@/lib/realtime";
import type { RealtimeMessageEvent } from "@/lib/realtime/types";
import type { Message } from "@/types/database";

interface UseRealtimeMessagesOptions {
  /** Card ID to filter by */
  readonly cardId?: string;
  /** Initial messages */
  readonly initialMessages?: Message[];
}

interface UseRealtimeMessagesResult {
  readonly messages: Message[];
  readonly isConnected: boolean;
  readonly error: Error | null;
}

function assertNever(value: never): never {
  throw new Error(`Unexpected real-time event type: ${String(value)}`);
}

/**
 * React hook for subscribing to real-time message updates.
 *
 * @param options - Hook options
 * @returns Messages and connection state
 */
export function useRealtimeMessages(
  options: UseRealtimeMessagesOptions = {},
): UseRealtimeMessagesResult {
  const [messages, setMessages] = useState<Message[]>(options.initialMessages ?? []);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleMessage = useCallback((event: RealtimeMessageEvent) => {
    setMessages((previousMessages) => {
      switch (event.type) {
        case "INSERT":
          return event.new ? [event.new, ...previousMessages] : previousMessages;

        case "UPDATE": {
          const updatedMessage = event.new;
          return updatedMessage
            ? previousMessages.map((message) =>
                message.id === updatedMessage.id ? updatedMessage : message,
              )
            : previousMessages;
        }

        case "DELETE": {
          const deletedMessage = event.old;
          return deletedMessage
            ? previousMessages.filter((message) => message.id !== deletedMessage.id)
            : previousMessages;
        }

        default:
          return assertNever(event.type);
      }
    });
  }, []);

  const handleError = useCallback((subscriptionError: Error) => {
    setError(subscriptionError);
    setIsConnected(false);
  }, []);

  useEffect(() => {
    const subscriptionOptions = {
      onMessage: handleMessage,
      onError: handleError,
      ...(options.cardId !== undefined ? { cardId: options.cardId } : {}),
    };
    const unsubscribe = subscribeToMessages(subscriptionOptions);

    setIsConnected(true);

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [handleError, handleMessage, options.cardId]);

  return { messages, isConnected, error };
}
