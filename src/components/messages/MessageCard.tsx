import type { Message } from "@/types/database";

interface MessageCardProps {
  readonly message: Message;
}

export function MessageCard({ message }: MessageCardProps) {
  const publishedAt = message.published_at
    ? new Date(message.published_at).toLocaleDateString("pt-BR")
    : "Recentemente";

  return (
    <article className="grid gap-4 border border-border bg-surface-elevated p-6">
      <p className="max-w-[68ch] whitespace-pre-wrap break-words text-lg leading-7 text-text-primary">
        {message.content}
      </p>
      <footer className="flex items-center justify-between gap-4 border-t border-border pt-3 text-sm text-text-secondary">
        <span>{message.nickname ?? "Anônimo"}</span>
        <time dateTime={new Date(message.published_at).toISOString()}>{publishedAt}</time>
      </footer>
    </article>
  );
}
