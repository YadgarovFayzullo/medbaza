import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-accent/20 bg-white px-6 py-14 text-center">
      <Icon className="h-6 w-6 text-primary-ink" aria-hidden />
      <p className="text-base font-semibold text-accent">{title}</p>
      {description ? <p className="max-w-sm text-sm text-accent/60">{description}</p> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
