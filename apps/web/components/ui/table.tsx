import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

/** Wide tables scroll inside their own container; the page never scrolls sideways. */
export function TableWrap({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-accent/10 bg-white', className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-accent/10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-accent/60',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <td className={cn('border-b border-accent/[0.06] px-4 py-3 align-middle', className)}>
      {children}
    </td>
  );
}
