import { cn } from "@/lib/utils";

const badgeVariants = {
  default: "border-transparent bg-red-500 text-text-inverse",
  secondary: "border-transparent bg-charcoal-600 text-text-primary",
  destructive: "border-transparent bg-red-900 text-red-500",
  outline: "border-border-strong bg-transparent text-text-primary",
} as const;
const badgeSizes = {
  sm: "min-h-8 px-2 text-xs",
  default: "min-h-8 px-3 text-sm",
  lg: "min-h-11 px-4 text-base",
} as const;
type BadgeVariant = keyof typeof badgeVariants;
type BadgeSize = keyof typeof badgeSizes;

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  readonly variant?: BadgeVariant;
  readonly size?: BadgeSize;
};

function Badge({ className, variant = "default", size = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border font-medium",
        badgeVariants[variant],
        badgeSizes[size],
        className,
      )}
      {...props}
    />
  );
}

export type { BadgeProps, BadgeSize, BadgeVariant };
export { Badge };
