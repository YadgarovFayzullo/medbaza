'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { SessionProvider } from '@/features/auth/session-provider';
import { CartProvider } from '@/features/cart/cart-provider';
import { SavedProvider } from '@/features/saved/saved-provider';
import type { User } from '@/lib/auth/session';

/**
 * Auth/session and cart are the two contexts CLAUDE.md §3.8 allows. Saved items
 * are a third, kept deliberately thin: it holds a list of product IDs in
 * `localStorage` and talks to no API, so it carries no server state that could
 * disagree with the backend.
 */
export function Providers({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: User | null;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider initialUser={initialUser}>
        <CartProvider>
          <SavedProvider>{children}</SavedProvider>
        </CartProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
