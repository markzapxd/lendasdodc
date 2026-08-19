"use client";

import { Check, PaperPlaneRight, UserCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { submitMessageAction } from "@/app/(public)/actions";
import { useTheme } from "@/components/theme/ThemeContext";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import type { Message } from "@/types/database";
import { MessageCard } from "./MessageCard";

interface MessageFeedProps {
  readonly messages: readonly Message[];
  readonly cardId: string;
  readonly cardName?: string;
}

export function MessageFeed({ messages: initialMessages, cardId }: MessageFeedProps) {
  const { config } = useTheme();
  const [content, setContent] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const { messages: liveMessages } = useRealtimeMessages({
    cardId,
    initialMessages,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!content.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const idempotencyKey = `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    try {
      const result = await submitMessageAction(cardId, content.trim(), idempotencyKey);

      if (result.success) {
        setSubmitted(true);
        setContent("");
        router.refresh();
        const timer = setTimeout(() => {
          setSubmitted(false);
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        setError(result.error.message);
      }
    } catch (_err) {
      setError("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      {/* Inline Post Composer (Top of Feed) */}
      <section className="border-b border-white/10 p-4 sm:p-5 bg-black">
        {submitted ? (
          <div
            className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 font-medium"
            role="status"
          >
            <Check className="h-4 w-4 shrink-0" />
            <span>Mensagem publicada com sucesso no perfil!</span>
          </div>
        ) : (
          <form
            id={`message-form-${cardId}`}
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
          >
            <div className="flex gap-3 items-start">
              {/* Default User Avatar Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#a595b8]">
                <UserCircle className="h-6 w-6" style={{ color: config.primaryHex }} />
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva uma mensagem anônima..."
                  maxLength={500}
                  rows={3}
                  required
                  className="w-full bg-transparent text-sm sm:text-base text-white placeholder:text-[#a595b8]/60 outline-none resize-none border-b border-white/10 pb-2 transition-colors"
                />

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-3 ml-auto">
                    {/* Character counter */}
                    <span className="text-xs font-mono text-[#a595b8]/50">
                      {content.length}/500
                    </span>

                    {/* Post button */}
                    <button
                      type="submit"
                      disabled={submitting || !content.trim()}
                      style={{ backgroundColor: config.primaryHex }}
                      className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>{submitting ? "Publicando..." : "Publicar"}</span>
                      <PaperPlaneRight weight="fill" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="text-xs font-medium text-red-500 pl-13">{error}</p>}
          </form>
        )}
      </section>

      {/* Messages List (X/Twitter style timeline) */}
      <section aria-label="Mensagens publicadas" className="divide-y divide-white/10">
        {liveMessages.length === 0 ? (
          <div className="py-16 text-center text-[#a595b8]">
            <p className="text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-xs text-[#a595b8]/60 mt-1">Seja o primeiro a publicar algo!</p>
          </div>
        ) : (
          liveMessages.map((message) => <MessageCard key={message.id} message={message} />)
        )}
      </section>
    </div>
  );
}
