import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

/**
 * Elevation comes from a hairline border or a background step — never a shadow
 * (CLAUDE.md §9).
 */
export function Card({
  as: Tag = 'div',
  className,
  children,
}: {
  as?: 'div' | 'section' | 'article' | 'li';
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={cn('rounded-lg border border-accent/10 bg-white', className)}>{children}</Tag>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-accent/10 p-5',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h2 className={cn('text-lg font-medium', className)}>{children}</h2>;
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex items-center gap-3 border-t border-accent/10 p-5', className)}>
      {children}
    </div>
  );
}
