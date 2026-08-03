import { cn } from "@/lib/utils";

type GridProps = React.HTMLAttributes<HTMLDivElement> & {
  readonly columns?: 1 | 2 | 3 | 4 | 6 | 12;
};

function Grid({ className, columns = 12, ...props }: GridProps) {
  const columnClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-1 md:grid-cols-2"
        : columns === 3
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : columns === 4
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            : columns === 6
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
              : "grid-cols-1 md:grid-cols-6 lg:grid-cols-12";
  return <div className={cn("grid gap-6", columnClass, className)} {...props} />;
}

export type { GridProps };
export { Grid };
