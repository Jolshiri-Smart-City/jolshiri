export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="flex gap-3">
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="flex gap-2 border-t border-border/60 p-3">
        <div className="h-8 flex-1 animate-pulse rounded bg-muted" />
        <div className="h-8 flex-1 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
