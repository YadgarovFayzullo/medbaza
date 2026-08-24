'use client';

import { useState } from 'react';
import { Check, Minus, Plus, ShoppingCart } from 'lucide-react';

import { useCart } from '@/features/cart/cart-provider';
import { cn } from '@/lib/utils/cn';

/**
 * Kartochkadagi xarid tugmasi.
 *
 * Mahsulot savatga tushgach tugma miqdor o‘zgartirgichga aylanadi, shuning uchun
 * ro‘yxatdan chiqmasdan xarid qilish mumkin. Miqdor o‘zgarishi optimistik va
 * server javobi bilan solishtiriladi (CLAUDE.md §3.8).
 */
export function QuickAddToCart({
  productId,
  productName,
  inStock,
  stock,
}: {
  productId: string;
  productName: string;
  inStock: boolean;
  stock: number;
}) {
  const { cart, add, setQuantity } = useCart();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const line = cart?.groups
    .flatMap((group) => group.items)
    .find((item) => item.product_id === productId);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setFailed(false);
    try {
      await action();
    } catch {
      // Batafsil xabar savat sahifasida; kartochka shunchaki yolg‘on ko‘rsatmaydi.
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  if (!inStock || stock <= 0) {
    return (
      <p className="flex h-9 items-center justify-center rounded-lg border border-accent/10 bg-base text-xs font-medium text-accent/45">
        Mavjud emas
      </p>
    );
  }

  if (line) {
    return (
      <div className="flex h-9 items-stretch overflow-hidden rounded-lg border border-primary-ink/50">
        <button
          type="button"
          aria-label={`${productName}: miqdorni kamaytirish`}
          disabled={busy}
          onClick={() => run(() => setQuantity(line.id, Math.max(0, line.quantity - 1)))}
          className="w-9 bg-white text-primary-ink hover:bg-primary/5 disabled:opacity-40"
        >
          <Minus className="mx-auto h-3.5 w-3.5" aria-hidden />
        </button>
        <span className="flex flex-1 items-center justify-center bg-white text-sm font-semibold text-accent">
          {line.quantity}
        </span>
        <button
          type="button"
          aria-label={`${productName}: miqdorni oshirish`}
          disabled={busy || line.quantity >= stock}
          onClick={() => run(() => setQuantity(line.id, line.quantity + 1))}
          className="w-9 bg-white text-primary-ink hover:bg-primary/5 disabled:opacity-40"
        >
          <Plus className="mx-auto h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => run(() => add(productId, 1))}
      className={cn(
        'flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors',
        failed
          ? 'border-accent/30 bg-white text-accent'
          : 'border-primary-ink/50 bg-primary-ink text-white hover:bg-primary-ink/90',
        busy && 'opacity-60',
      )}
    >
      {failed ? (
        <>Qayta urinish</>
      ) : busy ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden />
          Qo’shilmoqda…
        </>
      ) : (
        <>
          <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
          Savatga
        </>
      )}
    </button>
  );
}
