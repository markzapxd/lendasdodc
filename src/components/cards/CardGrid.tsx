import { EmptyState } from "@/components/system/empty-state";
import type { Card } from "@/types/database";
import { CardCard } from "./CardCard";

interface CardGridProps {
  readonly cards: readonly Card[];
}

export function CardGrid({ cards }: CardGridProps) {
  if (cards.length === 0) {
    return <EmptyState title="nada ainda" />;
  }

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3.5 sm:grid-cols-2">
      {cards.map((card) => (
        <CardCard key={card.id} card={card} />
      ))}
    </div>
  );
}
