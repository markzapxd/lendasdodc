import { cn } from "@/lib/utils";

const clusterGaps = {
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
} as const;
type ClusterGap = keyof typeof clusterGaps;
type ClusterProps = React.HTMLAttributes<HTMLDivElement> & {
  readonly gap?: ClusterGap;
  readonly align?: "start" | "center" | "end" | "baseline";
  readonly nowrap?: boolean;
};

function Cluster({ className, gap = 4, align = "center", nowrap = false, ...props }: ClusterProps) {
  return (
    <div
      className={cn(
        "flex",
        nowrap ? "flex-nowrap" : "flex-wrap",
        align === "start"
          ? "items-start"
          : align === "end"
            ? "items-end"
            : align === "baseline"
              ? "items-baseline"
              : "items-center",
        clusterGaps[gap],
        className,
      )}
      {...props}
    />
  );
}

export type { ClusterGap, ClusterProps };
export { Cluster };
