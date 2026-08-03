import type { Icon } from "@phosphor-icons/react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  readonly title?: string;
  readonly description?: string;
  readonly icon?: Icon;
  readonly action?: { readonly label: string; readonly onClick?: ButtonProps["onClick"] };
  readonly compact?: boolean;
};

function EmptyState({
  title = "Nada por aqui ainda",
  description = "Quando houver mensagens, elas aparecerão neste espaço.",
  icon: IconComponent = MagnifyingGlass,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <section
      aria-labelledby="empty-state-title"
      className={cn(
        "grid justify-items-center border border-dashed border-border p-6 text-center",
        compact ? "gap-3" : "gap-4 p-8",
      )}
    >
      <IconComponent className="size-10 text-text-secondary" aria-hidden="true" />
      <div className="grid max-w-md gap-2">
        <h3 id="empty-state-title" className="text-xl font-semibold">
          {title}
        </h3>
        <p className="text-text-secondary">{description}</p>
      </div>
      {action ? (
        <Button variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </section>
  );
}

export type { EmptyStateProps };
export { EmptyState };
