import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

type Tone = 'info' | 'success' | 'warning';

const ICONS = { info: Info, success: CheckCircle2, warning: AlertTriangle } as const;

const TONES: Record<Tone, string> = {
  info: 'border-accent/15 bg-base text-accent',
  success: 'border-primary/25 bg-primary/5 text-accent',
  warning: 'border-accent/25 bg-white text-accent',
};

/** Tone is carried by border and background step, never by a fourth colour. */
export function Alert({
  tone = 'info',
  title,
  className,
  children,
}: {
  tone?: Tone;
  title?: string;
  className?: string;
  children?: ReactNode;
}) {
  const Icon = ICONS[tone];
  return (
    <div
      role={tone === 'warning' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg border p-4 text-sm', TONES[tone], className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-ink" aria-hidden />
      <div className="space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-accent/75">{children}</div> : null}
      </div>
    </div>
  );
}
