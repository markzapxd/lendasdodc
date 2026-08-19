import { User } from "@phosphor-icons/react/dist/ssr";
import type { Message } from "@/types/database";

interface MessageCardProps {
  readonly message: Message;
}

export function MessageCard({ message }: MessageCardProps) {
  const dateObj = message.published_at ? new Date(message.published_at) : null;
  const isValidDate = dateObj !== null && !Number.isNaN(dateObj.getTime());

  const publishedAt = isValidDate ? dateObj.toLocaleDateString("pt-BR") : "Agora";
  const authorName = message.nickname?.trim() || "Anônimo";
  const initial = authorName.charAt(0).toUpperCase();

  return (
    <article className="flex gap-3.5 p-4 sm:p-5 transition-colors hover:bg-[#12081a]/40">
      {/* Avatar Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#2b1742] bg-[#1a0e28] text-[#ec195a] font-bold text-sm">
        {initial !== "A" ? initial : <User className="h-5 w-5 text-[#ec195a]" />}
      </div>

      {/* Post Body */}
      <div className="flex-1 min-w-0">
        {/* Header Metadata */}
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="font-bold text-white truncate">{authorName}</span>
          <span className="text-[#a595b8]/60 font-normal">·</span>
          <time
            dateTime={isValidDate ? dateObj.toISOString() : undefined}
            className="text-xs text-[#a595b8]/60 font-normal"
          >
            {publishedAt}
          </time>
        </div>

        {/* Content */}
        <p className="mt-1.5 text-sm sm:text-base leading-relaxed text-white/95 font-normal whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>
    </article>
  );
}
