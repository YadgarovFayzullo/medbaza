import { formatMoney } from '@/lib/utils/money';
import { cn } from '@/lib/utils/cn';

/**
 * The single place a price becomes text. Everything upstream carries integer
 * minor units plus an ISO-4217 code (CLAUDE.md §5.1).
 */
export function Price({
  amountMinor,
  currency,
  unit,
  className,
  size = 'md',
}: {
  amountMinor: number;
  currency: string;
  unit?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' } as const;
  return (
    <span className={cn('font-semibold text-accent', sizes[size], className)}>
      {formatMoney(amountMinor, currency)}
      {unit ? <span className="ml-1 text-xs font-normal text-accent/50">/ {unit}</span> : null}
    </span>
  );
}
