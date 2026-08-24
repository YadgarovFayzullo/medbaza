'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

import { useCart } from '@/features/cart/cart-provider';

export function CartButton() {
  const { itemCount } = useCart();
  return (
    <Link
      href="/cart"
      className="relative inline-flex h-11 items-center gap-2 rounded-lg border border-accent/15 bg-white px-4 text-sm font-medium hover:border-accent/30"
    >
      <ShoppingCart className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">Cart</span>
      <span
        aria-label={`${itemCount} items in cart`}
        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-ink px-1.5 text-xs font-semibold text-white"
      >
        {itemCount}
      </span>
    </Link>
  );
}
