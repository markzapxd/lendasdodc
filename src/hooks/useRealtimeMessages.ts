"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeToMessages } from "@/lib/realtime";
import type { RealtimeMessageEvent } from "@/lib/realtime/types";
import type { Message } from "@/types/database";

interface UseRealtimeMessagesOptions {
  /** Card ID to filter by */
  readonly cardId?: string;
  /** Initial messages */
  readonly initialMessages?: readonly Message[];
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
  const [messages, setMessages] = useState<Message[]>(() =>
    options.initialMessages ? [...options.initialMessages] : [],
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cardId = options.cardId;

  useEffect(() => {
    let isMounted = true;

    const subscriptionOptions = {
      onMessage: (event: RealtimeMessageEvent) => {
        if (!isMounted) return;
        setMessages((previousMessages) => {
          switch (event.type) {
            case "INSERT": {
              if (!event.new) return previousMessages;
              const exists = previousMessages.some((m) => m.id === event.new?.id);
              return exists ? previousMessages : [event.new, ...previousMessages];
            }

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
      },
      onError: (subscriptionError: Error) => {
        if (!isMounted) return;
        setError(subscriptionError);
        setIsConnected(false);
      },
      ...(cardId !== undefined ? { cardId } : {}),
    };

    const unsubscribe = subscribeToMessages(subscriptionOptions);
    setIsConnected(true);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [cardId]);

  return { messages, isConnected, error };
}
