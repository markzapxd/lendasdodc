import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & { readonly label?: string };

function Skeleton({ className, label = "Carregando", ...props }: SkeletonProps) {
  return (
    <div
      aria-label={label}
      aria-busy="true"
      role="status"
      className={cn("motion-safe:animate-pulse rounded-md bg-charcoal-600", className)}
      {...props}
    />
  );
}

export type { SkeletonProps };
export { Skeleton };
