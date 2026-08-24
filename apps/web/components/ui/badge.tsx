import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

type Tone = 'neutral' | 'primary' | 'muted';

const TONES: Record<Tone, string> = {
  neutral: 'border-accent/15 bg-white text-accent',
  primary: 'border-primary/25 bg-primary/10 text-primary-ink',
  muted: 'border-accent/10 bg-base text-accent/70',
};

/** Pill badges are the one place `rounded-full` is allowed besides avatars. */
export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
