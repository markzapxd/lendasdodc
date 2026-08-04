"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message } from "@/types/database";
import { MessageCard } from "./MessageCard";

interface MessageFeedProps {
  readonly messages: readonly Message[];
  readonly cardId: string;
  readonly cardName?: string;
}

export function MessageFeed({ messages, cardId }: MessageFeedProps) {
  const [content, setContent] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!content.trim()) {
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitted(true);
      setContent("");
      setSubmitting(false);
    }, 1000);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(18rem,3fr)] lg:items-start">
      <section className="grid gap-6" aria-label="Mensagens">
        {messages.length === 0 ? (
          <div className="border border-dashed border-border p-8 text-center">
            <p className="text-text-secondary">Nenhuma mensagem ainda. Seja o primeiro.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {messages.map((message) => (
              <MessageCard key={message.id} message={message} />
            ))}
          </div>
        )}
      </section>

      <section
        className="border border-border bg-surface-elevated p-6"
        aria-label="Enviar mensagem"
      >
        {submitted ? (
          <div className="grid gap-3 border border-green-500/50 bg-green-500/10 p-4" role="status">
            <p className="font-semibold text-green-500">Mensagem enviada para moderação.</p>
            <p className="text-sm text-text-secondary">Ela será publicada após a revisão.</p>
            <Button variant="outline" onClick={() => setSubmitted(false)}>
              Enviar outra
            </Button>
          </div>
        ) : (
          <form id={`message-form-${cardId}`} className="grid gap-4" onSubmit={handleSubmit}>
            <Textarea
              label="Sua mensagem"
              value={content}
              onChange={(event) => setContent(event.currentTarget.value)}
              placeholder="Escreva sua mensagem anônima..."
              maxLength={500}
              showCount
              required
            />
            <div className="flex justify-end">
              <Button type="submit" loading={submitting} disabled={!content.trim()}>
                Enviar mensagem
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
