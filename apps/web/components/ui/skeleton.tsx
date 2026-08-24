import { cn } from '@/lib/utils/cn';

/** Flat placeholder — a background step, no shimmer gradient (§9). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-accent/10', className)} />;
}
