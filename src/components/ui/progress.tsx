import { cn } from "@/lib/utils";

const progressVariants = {
  default: "bg-red-500",
  success: "bg-green-500",
  warning: "bg-amber-500",
} as const;
type ProgressVariant = keyof typeof progressVariants;
type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  readonly value?: number;
  readonly max?: number;
  readonly label: string;
  readonly indeterminate?: boolean;
  readonly variant?: ProgressVariant;
};

function Progress({
  value = 0,
  max = 100,
  label,
  indeterminate = false,
  variant = "default",
  className,
  ...props
}: ProgressProps) {
  const percentage = indeterminate ? undefined : Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div
      aria-label={label}
      aria-valuemax={indeterminate ? undefined : max}
      aria-valuemin={indeterminate ? undefined : 0}
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuetext={indeterminate ? "Em andamento" : `${Math.round(percentage ?? 0)}%`}
      role="progressbar"
      className={cn("h-3 w-full overflow-hidden rounded-sm bg-charcoal-600", className)}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-sm transition-[width] duration-250 ease-in-out",
          progressVariants[variant],
          indeterminate ? "w-1/2 motion-safe:animate-pulse" : undefined,
        )}
        style={{ width: indeterminate ? undefined : `${percentage}%` }}
      />
    </div>
  );
}

export type { ProgressProps, ProgressVariant };
export { Progress };
