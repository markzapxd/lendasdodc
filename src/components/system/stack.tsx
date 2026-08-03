import { cn } from "@/lib/utils";

const stackGaps = {
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
  12: "gap-12",
} as const;
type StackGap = keyof typeof stackGaps;
type StackProps = React.HTMLAttributes<HTMLDivElement> & { readonly gap?: StackGap };

function Stack({ className, gap = 4, ...props }: StackProps) {
  return <div className={cn("flex flex-col", stackGaps[gap], className)} {...props} />;
}

export type { StackGap, StackProps };
export { Stack };
