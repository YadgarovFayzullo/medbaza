'use client';

import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Store, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Price } from '@/components/domain/price';
import { PrescriptionBadge, VerifiedSellerBadge } from '@/components/domain/trust';
import { Alert, ButtonLink, Card, EmptyState, Skeleton } from '@/components/ui';
import { useCart } from '@/features/cart/cart-provider';
import { formatMoney } from '@/lib/utils/money';

export function CartView() {
  const { cart, isLoading, setQuantity, remove } = useCart();
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!cart || cart.item_count === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Savatingiz bo’sh"
        description="Litsenziyasi tekshirilgan sotuvchilardan himoya vositalari, diagnostika va boshqalarni ko’ring."
        action={<ButtonLink href="/search">Xarid qilishni boshlash</ButtonLink>}
      />
    );
  }

  async function run(itemId: string, action: () => Promise<void>) {
    setBusyItem(itemId);
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Savatni yangilab bo’lmadi.');
    } finally {
      setBusyItem(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {error ? (
          <Alert tone="warning" title="Savat yangilanmadi">
            {error}
          </Alert>
        ) : null}

        {cart.warnings.length > 0 ? (
          <Alert tone="warning" title="Ba’zi mahsulotlar o’zgardi">
            <ul className="list-disc space-y-1 pl-4">
              {cart.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        {/* Har bir sotuvchi uchun alohida guruh — rasmiylashtirishda ham xuddi shunday bo‘linadi. */}
        {cart.groups.map((group) => (
          <Card key={group.seller.id}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-accent/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Store className="h-4 w-4 text-accent/40" aria-hidden />
                {group.seller.business_name}
              </p>
              <VerifiedSellerBadge verified={group.seller.verified} />
            </div>

            <ul className="divide-y divide-accent/10">
              {group.items.map((item) => (
                <li key={item.id} className="flex flex-wrap gap-4 p-4">
                  <Link
                    href={`/product/${item.product_slug}`}
                    className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-accent/10 bg-base"
                  >
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ShoppingCart className="h-5 w-5 text-accent/20" aria-hidden />
                    )}
                  </Link>

                  <div className="min-w-48 flex-1 space-y-1.5">
                    <Link
                      href={`/product/${item.product_slug}`}
                      className="text-sm font-semibold hover:text-primary-ink"
                    >
                      {item.product_name}
                    </Link>
                    <p className="text-xs text-accent/50">
                      {formatMoney(item.unit_amount_minor, item.currency)} / dona
                    </p>
                    <PrescriptionBadge required={item.prescription_required} />
                    {!item.in_stock ? (
                      <p className="text-xs font-medium text-accent">
                        Atigi {item.stock_available} ta qoldi — miqdorni kamaytiring.
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-accent/15">
                      <button
                        type="button"
                        aria-label={`${item.product_name}: miqdorni kamaytirish`}
                        disabled={busyItem === item.id}
                        onClick={() =>
                          run(item.id, () => setQuantity(item.id, Math.max(1, item.quantity - 1)))
                        }
                        className="w-9 bg-white text-accent/60 hover:bg-base disabled:opacity-40"
                      >
                        <Minus className="mx-auto h-3.5 w-3.5" aria-hidden />
                      </button>
                      <span className="flex w-10 items-center justify-center border-x border-accent/15 text-sm">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`${item.product_name}: miqdorni oshirish`}
                        disabled={busyItem === item.id || item.quantity >= item.stock_available}
                        onClick={() => run(item.id, () => setQuantity(item.id, item.quantity + 1))}
                        className="w-9 bg-white text-accent/60 hover:bg-base disabled:opacity-40"
                      >
                        <Plus className="mx-auto h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>

                    <Price
                      amountMinor={item.line_amount_minor}
                      currency={item.currency}
                      size="sm"
                    />

                    <button
                      type="button"
                      aria-label={`${item.product_name}ni olib tashlash`}
                      disabled={busyItem === item.id}
                      onClick={() => run(item.id, () => remove(item.id))}
                      className="rounded-lg p-2 text-accent/40 hover:bg-base hover:text-accent disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex justify-between border-t border-accent/10 px-4 py-3 text-sm">
              <span className="text-accent/60">Sotuvchi bo’yicha jami</span>
              <span className="font-medium">
                {formatMoney(group.subtotal_amount_minor, cart.currency)}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <OrderSummary
        itemsAmountMinor={cart.items_amount_minor}
        shippingAmountMinor={cart.shipping_amount_minor}
        totalAmountMinor={cart.total_amount_minor}
        currency={cart.currency}
        sellerCount={cart.groups.length}
        prescriptionRequired={cart.prescription_required}
      />
    </div>
  );
}

export function OrderSummary({
  itemsAmountMinor,
  shippingAmountMinor,
  totalAmountMinor,
  currency,
  sellerCount,
  prescriptionRequired,
  action,
}: {
  itemsAmountMinor: number;
  shippingAmountMinor: number;
  totalAmountMinor: number;
  currency: string;
  sellerCount: number;
  prescriptionRequired: boolean;
  action?: React.ReactNode;
}) {
  return (
    <Card className="h-fit lg:sticky lg:top-40">
      <div className="space-y-4 p-5">
        <h2 className="text-lg font-medium">Buyurtma xulosasi</h2>
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-accent/60">Mahsulotlar</dt>
            <dd>{formatMoney(itemsAmountMinor, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-accent/60">
              Yetkazib berish
              {sellerCount > 1 ? (
                <span className="block text-xs text-accent/40">
                  {sellerCount} ta sotuvchi alohida jo’natadi
                </span>
              ) : null}
            </dt>
            <dd>
              {shippingAmountMinor === 0 ? 'Bepul' : formatMoney(shippingAmountMinor, currency)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-accent/10 pt-3 text-base font-semibold">
            <dt>Jami</dt>
            <dd>{formatMoney(totalAmountMinor, currency)}</dd>
          </div>
        </dl>

        {prescriptionRequired ? (
          <Alert tone="warning" title="Retsept kerak">
            Bir yoki bir nechta mahsulot jo’natishdan oldin retsept talab qiladi.
          </Alert>
        ) : null}

        {action ?? (
          <ButtonLink href="/checkout" size="lg" fullWidth>
            Rasmiylashtirishga o’tish
          </ButtonLink>
        )}

        <p className="text-xs text-accent/50">
          Narxlar rasmiylashtirishda server tomonidan tasdiqlanadi. Qoldiq faqat buyurtma berilganda
          band qilinadi.
        </p>
      </div>
    </Card>
  );
}
