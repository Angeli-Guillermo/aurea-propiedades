import { cn } from '@/lib/cn';

/** Bloque neutro con pulso, base de todos los estados de carga. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-lg bg-ink-900/[0.07]', className)}
    />
  );
}
