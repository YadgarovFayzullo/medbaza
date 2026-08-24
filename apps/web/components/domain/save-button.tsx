'use client';

import { Heart } from 'lucide-react';

import { useSaved } from '@/features/saved/saved-provider';
import { cn } from '@/lib/utils/cn';

export function SaveButton({
  productSlug,
  productName,
  className,
}: {
  productSlug: string;
  productName: string;
  className?: string;
}) {
  const { has, toggle, ready } = useSaved();
  const saved = ready && has(productSlug);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={
        saved ? `${productName}ni saralanganlardan olib tashlash` : `${productName}ni saqlash`
      }
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(productSlug);
      }}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full border border-accent/10 bg-white transition-colors hover:border-accent/30',
        className,
      )}
    >
      <Heart
        className={cn('h-4 w-4', saved ? 'fill-primary-ink text-primary-ink' : 'text-accent/40')}
        aria-hidden
      />
    </button>
  );
}
