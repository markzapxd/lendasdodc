import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Card } from "@/types/database";

interface CardCardProps {
  readonly card: Card;
}

export function CardCard({ card }: CardCardProps) {
  return (
    <Link
      href={`/card/${card.slug}`}
      className="group block border border-border bg-surface-elevated transition-colors duration-150 ease-in-out hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      {card.image_url ? (
        <div className="aspect-video overflow-hidden border-b border-border bg-charcoal-900">
          <img
            src={card.image_url}
            alt={card.image_alt ?? card.name}
            width={640}
            height={360}
            className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          />
        </div>
      ) : null}

      <div className="grid gap-4 p-6">
        <div className="grid gap-2">
          <h2 className="text-xl font-semibold text-text-primary">{card.name}</h2>
          <p className="line-clamp-3 text-text-secondary">
            {card.description ?? "Um mural aberto para mensagens anônimas."}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 text-sm text-text-secondary">
          <span>
            {card.message_count} {card.message_count === 1 ? "mensagem" : "mensagens"}
          </span>
          <Badge variant="outline" size="sm">
            Ver mural
          </Badge>
        </div>
      </div>
    </Link>
  );
}
