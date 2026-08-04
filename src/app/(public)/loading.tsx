import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <header className="mb-10 grid max-w-3xl gap-3">
        <Skeleton className="h-4 w-28" label="Carregando categoria" />
        <Skeleton className="h-10 w-64 sm:w-80" label="Carregando título" />
      </header>

      <div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        role="status"
        aria-label="Carregando murais"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: Static fallback list during loading
            key={index}
            className="border border-border bg-surface-elevated"
          >
            <div className="aspect-video border-b border-border">
              <Skeleton className="h-full w-full rounded-none" />
            </div>

            <div className="grid gap-4 p-6">
              <div className="grid gap-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
