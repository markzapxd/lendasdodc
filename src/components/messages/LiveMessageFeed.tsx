"use client";

import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import type { Message } from "@/types/database";
import { MessageCard } from "./MessageCard";

interface LiveMessageFeedProps {
  readonly cardId: string;
  readonly initialMessages: Message[];
}

export function LiveMessageFeed({ cardId, initialMessages }: LiveMessageFeedProps) {
  const { messages, isConnected, error } = useRealtimeMessages({
    cardId,
    initialMessages,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm" aria-live="polite">
        <span
          className={`size-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          aria-hidden="true"
        />
        <span className="text-text-secondary">
          {isConnected ? "Tempo real conectado" : "Desconectado"}
        </span>
      </div>

      {error && (
        <div
          className="border border-red-500 bg-red-900 p-3 text-sm text-text-primary"
          role="alert"
        >
          Erro na conexão: {error.message}
        </div>
      )}

      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="border border-dashed border-border py-8 text-center">
            <p className="text-text-secondary">Nenhuma mensagem ainda. Seja o primeiro!</p>
          </div>
        ) : (
          messages.map((message) => <MessageCard key={message.id} message={message} />)
        )}
      </div>
    </div>
  );
}
