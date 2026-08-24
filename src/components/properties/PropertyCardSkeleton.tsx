import { Skeleton } from '@/components/ui/Skeleton';

/** Esqueleto con la misma silueta que `PropertyCard` (evita saltos de layout). */
export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-soft">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-5 pt-4">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

/** Grid de esqueletos para el estado de carga de la sección. */
export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <PropertyCardSkeleton key={index} />
      ))}
    </div>
  );
}
