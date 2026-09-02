import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ rows = 3, label = "Carregando conteúdo" }: { rows?: number; label?: string }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-label={label}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="surface-card space-y-3 p-5">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
