import { EmptyState } from "@/components/system/empty-state";
import type { Card } from "@/types/database";
import { CardCard } from "./CardCard";

interface CardGridProps {
  readonly cards: readonly Card[];
}

export function CardGrid({ cards }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <EmptyState
        title="Nenhuma heroína disponível"
        description="Os murais estão sendo preparados. Volte em breve para escolher por onde começar."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <CardCard key={card.id} card={card} />
      ))}
    </div>
  );
}
