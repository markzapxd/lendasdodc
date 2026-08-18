"use client";

import { ChatCircleDots } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import type { Card } from "@/types/database";

interface CardCardProps {
  readonly card: Card;
}

export function CardCard({ card }: CardCardProps) {
  const messageLabel = card.message_count === 1 ? "1 mensagem" : `${card.message_count} mensagens`;
  const initial = card.name.charAt(0).toUpperCase();

  return (
    <Link
      href={`/card/${card.slug}`}
      className="group flex items-center justify-between gap-3.5 rounded-xl border border-[#2b1742]/50 bg-[#12081a]/50 p-3 transition-all duration-200 hover:border-[#ec195a]/40 hover:bg-[#1a0c24]/80"
    >
      {/* Avatar & User Info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar Container */}
        <div className="shrink-0">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#210d2e]">
            {card.image_url ? (
              <Image
                src={card.image_url}
                alt={card.image_alt ?? card.name}
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-[#ec195a]">
                {initial}
              </span>
            )}
          </div>
        </div>

        {/* Text Info */}
        <div className="flex flex-col min-w-0 justify-center">
          <h2 className="truncate text-sm sm:text-base font-semibold text-white transition-colors group-hover:text-pink-300">
            {card.name}
          </h2>
          <span className="text-xs text-[#a595b8]/70">
            {messageLabel}
          </span>
        </div>
      </div>

      {/* Sleek Minimal Chat Icon */}
      <div className="shrink-0 text-[#ec195a]/60 transition-colors group-hover:text-[#ec195a]">
        <ChatCircleDots className="h-5 w-5" />
      </div>
    </Link>
  );
}
