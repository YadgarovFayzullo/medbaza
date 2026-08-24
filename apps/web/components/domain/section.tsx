import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

export function Section({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn('space-y-5', className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl">{title}</h2>
          {description ? <p className="text-sm text-accent/60">{description}</p> : null}
        </div>
        {action ? (
          <Link href={action.href} className="text-sm font-medium text-primary-ink hover:underline">
            {action.label} →
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div className="space-y-1">
        <h1 className="text-3xl">{title}</h1>
        {description ? <p className="text-sm text-accent/60">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
