'use client';

import { useState } from 'react';
import { Check, ShoppingCart } from 'lucide-react';

import { useCart } from '@/features/cart/cart-provider';
import { Alert, Button } from '@/components/ui';

/**
 * Miqdor + savatga qo‘shish.
 *
 * Har bir o‘zgartirishda ko‘rinadigan yuklanish va xatolik holati bor — jimgina
 * yiqilish yo‘q (CLAUDE.md §3.8).
 */
export function AddToCart({
  productId,
  maxQuantity,
  disabled,
}: {
  productId: string;
  maxQuantity: number;
  disabled?: boolean;
}) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState<'idle' | 'saving' | 'added'>('idle');
  const [error, setError] = useState<string | null>(null);

  const soldOut = disabled || maxQuantity <= 0;

  async function submit() {
    setState('saving');
    setError(null);
    try {
      await add(productId, quantity);
      setState('added');
      setTimeout(() => setState('idle'), 2500);
    } catch (caught) {
      setState('idle');
      setError(caught instanceof Error ? caught.message : 'Mahsulotni qo’shib bo’lmadi.');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1.5">
          <span className="block text-sm font-medium">Miqdor</span>
          <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-accent/15">
            <button
              type="button"
              aria-label="Miqdorni kamaytirish"
              disabled={soldOut || quantity <= 1}
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="w-10 bg-white text-lg text-accent/60 hover:bg-base disabled:opacity-40"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={Math.max(1, maxQuantity)}
              value={quantity}
              aria-label="Miqdor"
              onChange={(event) =>
                setQuantity(
                  Math.min(Math.max(1, Number(event.target.value) || 1), Math.max(1, maxQuantity)),
                )
              }
              className="w-16 border-x border-accent/15 bg-white text-center text-sm focus:outline-none"
            />
            <button
              type="button"
              aria-label="Miqdorni oshirish"
              disabled={soldOut || quantity >= maxQuantity}
              onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
              className="w-10 bg-white text-lg text-accent/60 hover:bg-base disabled:opacity-40"
            >
              +
            </button>
          </div>
        </label>

        <Button
          size="lg"
          onClick={submit}
          disabled={soldOut}
          loading={state === 'saving'}
          className="flex-1 sm:flex-none"
        >
          {state === 'added' ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              Savatga qo’shildi
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" aria-hidden />
              {soldOut ? 'Mavjud emas' : 'Savatga qo’shish'}
            </>
          )}
        </Button>
      </div>

      {error ? (
        <Alert tone="warning" title="Mahsulot qo’shilmadi">
          {error}
        </Alert>
      ) : null}
    </div>
  );
}
