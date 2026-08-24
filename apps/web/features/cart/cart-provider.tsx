'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth/session-provider';
import { ApiError, requestWithHeaders, type Cart } from '@/features/cart/api';

/**
 * Cart state.
 *
 * Mutations are optimistic and reconciled against the server response — the
 * server is authoritative on price and stock, always (CLAUDE.md §3.8).
 */
interface CartValue {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  error: string | null;
  add: (productId: string, quantity?: number) => Promise<void>;
  setQuantity: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartValue | null>(null);
export const CART_QUERY_KEY = ['cart'] as const;

export function CartProvider({ children }: { children: ReactNode }) {
  const { getToken, ready } = useSession();
  const queryClient = useQueryClient();

  const call = useCallback(
    async (path: string, init: Parameters<typeof requestWithHeaders>[1] = {}) => {
      const token = await getToken();
      return requestWithHeaders<Cart>(path, { ...init, token });
    },
    [getToken],
  );

  const query = useQuery({
    queryKey: CART_QUERY_KEY,
    enabled: ready,
    queryFn: async () => (await call('/cart')).data,
  });

  const mutation = useMutation({
    mutationFn: async (input: {
      path: string;
      method: 'POST' | 'PATCH' | 'DELETE';
      body?: unknown;
    }) => (await call(input.path, { method: input.method, body: input.body })).data,
    onSuccess: (cart) => queryClient.setQueryData(CART_QUERY_KEY, cart),
  });

  const optimistic = useCallback(
    (update: (cart: Cart) => Cart) => {
      const current = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
      if (current) queryClient.setQueryData(CART_QUERY_KEY, update(current));
      return current;
    },
    [queryClient],
  );

  const value = useMemo<CartValue>(() => {
    const run = async (
      path: string,
      method: 'POST' | 'PATCH' | 'DELETE',
      body?: unknown,
      rollback?: Cart,
    ) => {
      try {
        await mutation.mutateAsync({ path, method, body });
      } catch (error) {
        // Solishtirish: serverning ko‘rinishini qaytarib, sababni ko‘rsatamiz.
        if (rollback) queryClient.setQueryData(CART_QUERY_KEY, rollback);
        else await queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
        throw error;
      }
    };

    return {
      cart: query.data ?? null,
      isLoading: query.isLoading,
      itemCount: query.data?.item_count ?? 0,
      error:
        mutation.error instanceof ApiError
          ? mutation.error.message
          : mutation.error
            ? 'Savatni yangilab bo’lmadi.'
            : null,
      add: async (productId, quantity = 1) => {
        await run('/cart/items', 'POST', { product_id: productId, quantity });
      },
      setQuantity: async (itemId, quantity) => {
        const previous = optimistic((cart) => ({
          ...cart,
          item_count: cart.groups
            .flatMap((group) => group.items)
            .reduce((total, item) => total + (item.id === itemId ? quantity : item.quantity), 0),
          groups: cart.groups.map((group) => ({
            ...group,
            items: group.items.map((item) =>
              item.id === itemId
                ? { ...item, quantity, line_amount_minor: item.unit_amount_minor * quantity }
                : item,
            ),
          })),
        }));
        await run(`/cart/items/${itemId}`, 'PATCH', { quantity }, previous);
      },
      remove: async (itemId) => {
        const previous = optimistic((cart) => ({
          ...cart,
          groups: cart.groups
            .map((group) => ({
              ...group,
              items: group.items.filter((item) => item.id !== itemId),
            }))
            .filter((group) => group.items.length > 0),
        }));
        await run(`/cart/items/${itemId}`, 'DELETE', undefined, previous);
      },
      clear: async () => {
        await run('/cart', 'DELETE');
      },
      refresh: async () => {
        await queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      },
    };
  }, [query.data, query.isLoading, mutation, optimistic, queryClient]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside <CartProvider>');
  return value;
}
