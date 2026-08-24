'use client';

import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';

import { useCart } from '@/features/cart/cart-provider';
import { useSaved } from '@/features/saved/saved-provider';

function Counter({ value }: { value: number }) {
  if (value === 0) return null;
  return (
    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-ink px-1 text-[10px] font-semibold text-white">
      {value > 99 ? '99+' : value}
    </span>
  );
}

export function SavedLink() {
  const { slugs } = useSaved();
  return (
    <Link
      href="/saved"
      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-accent/70 hover:text-primary-ink"
    >
      <span className="relative">
        <Heart className="h-5 w-5" aria-hidden />
        <Counter value={slugs.length} />
      </span>
      Saralangan
    </Link>
  );
}

export function CartLink() {
  const { itemCount } = useCart();
  return (
    <Link
      href="/cart"
      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-accent/70 hover:text-primary-ink"
    >
      <span className="relative">
        <ShoppingCart className="h-5 w-5" aria-hidden />
        <Counter value={itemCount} />
      </span>
      Savat
    </Link>
  );
}
