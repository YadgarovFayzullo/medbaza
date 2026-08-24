'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert, Button, Textarea } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';
import { ApiError, request } from '@/lib/api-client';
import type { Order } from '@/lib/api-client/endpoints';

const CANCELLABLE = new Set(['pending_payment', 'paid', 'processing', 'payment_failed']);
const RETURNABLE = new Set(['delivered']);

/** Bekor qilish yoki qaytarish ochish — ko‘rinadigan yuklanish va xatolik holati bilan. */
export function OrderActions({ order }: { order: Order }) {
  const router = useRouter();
  const { getToken } = useSession();
  const [open, setOpen] = useState<'cancel' | string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCancel = order.shipments.some((shipment) => CANCELLABLE.has(shipment.status));
  const returnable = order.shipments.filter((shipment) => RETURNABLE.has(shipment.status));

  if (!canCancel && returnable.length === 0) return null;

  async function submit(path: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await request(path, { method: 'POST', body: { reason }, token });
      setOpen(null);
      setReason('');
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Amal bajarilmadi. Qayta urinib ko’ring.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full space-y-3">
      {error ? (
        <Alert tone="warning" title="Buyurtmani yangilab bo’lmadi">
          {error}
        </Alert>
      ) : null}

      {open ? (
        <div className="space-y-3">
          <Textarea
            label="Sabab"
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            hint={
              open === 'cancel'
                ? 'Jo’natishdan oldin bekor qilinsa, qoldiq boshqa xaridorlarga qaytadi.'
                : 'Sotuvchiga muammoni tushuntiring — qaytarishga tayyorlanadi.'
            }
          />
          <div className="flex gap-3">
            <Button
              loading={busy}
              disabled={reason.trim().length === 0}
              onClick={() =>
                submit(
                  open === 'cancel'
                    ? `/orders/${order.id}/cancel`
                    : `/orders/shipments/${open}/return`,
                )
              }
            >
              Tasdiqlash
            </Button>
            <Button variant="ghost" onClick={() => setOpen(null)}>
              Kerak emas
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {canCancel ? (
            <Button variant="secondary" onClick={() => setOpen('cancel')}>
              Buyurtmani bekor qilish
            </Button>
          ) : null}
          {returnable.map((shipment) => (
            <Button key={shipment.id} variant="secondary" onClick={() => setOpen(shipment.id)}>
              {shipment.seller_name} mahsulotlarini qaytarish
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
