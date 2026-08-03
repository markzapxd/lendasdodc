import type { Icon } from "@phosphor-icons/react";
import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  readonly title?: string;
  readonly description?: string;
  readonly icon?: Icon;
  readonly retry?: {
    readonly label?: string;
    readonly onClick: () => void;
    readonly loading?: boolean;
  };
  readonly details?: string;
  readonly severity?: "recoverable" | "blocked" | "offline";
};

function ErrorState({
  title = "Não foi possível carregar",
  description = "Algo interrompeu esta leitura. Tente novamente ou volte em alguns instantes.",
  icon: IconComponent = WarningCircle,
  retry,
  details,
  severity = "recoverable",
}: ErrorStateProps) {
  const retryButtonProps = retry?.loading === undefined ? {} : { loading: retry.loading };

  return (
    <section
      aria-labelledby="error-state-title"
      className={cn(
        "grid gap-4 border border-red-500 bg-red-900 p-6",
        severity === "blocked" && "border-red-700",
      )}
      role="alert"
    >
      <IconComponent className="size-10 text-red-500" aria-hidden="true" />
      <div className="grid gap-2">
        <h3 id="error-state-title" className="text-xl font-semibold">
          {title}
        </h3>
        <p className="max-w-2xl text-text-secondary">{description}</p>
      </div>
      {details ? (
        <details className="text-sm text-text-secondary">
          <summary className="cursor-pointer font-medium text-text-primary">
            Ver detalhes técnicos
          </summary>
          <p className="mt-2 break-words">{details}</p>
        </details>
      ) : null}
      {retry ? (
        <Button variant="destructive" {...retryButtonProps} onClick={retry.onClick}>
          <ArrowClockwise className="size-4" aria-hidden="true" />
          {retry.label ?? "Tentar novamente"}
        </Button>
      ) : null}
    </section>
  );
}

export type { ErrorStateProps };
export { ErrorState };
