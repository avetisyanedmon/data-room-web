import { Skeleton } from '@/components/ui/Skeleton';

/** Mirrors the real row grid — Axiom 04, minus the "decrypting" theatre. */
export function ExplorerSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-vault-100 bg-white">
      <div className="border-b border-vault-100 bg-vault-50/70 px-5 py-2.5">
        <Skeleton className="h-2.5 w-40" />
      </div>
      <div className="divide-y divide-vault-100">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="flex items-center gap-4 px-5 py-3.5" style={{ opacity: 1 - row * 0.15 }}>
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-2.5 w-1/5" />
            </div>
            <Skeleton className="hidden h-2.5 w-16 lg:block" />
            <Skeleton className="hidden h-2.5 w-28 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
