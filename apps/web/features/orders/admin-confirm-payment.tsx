'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert, Button, Input } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';
import { ApiError, request } from '@/lib/api-client';
import type { Order } from '@/lib/api-client/endpoints';
import { formatMoney } from '@/lib/utils/money';

/**
 * To’lov hisob-faktura bo’yicha yoki qabul qilishda olinadi (PAYMENT_PROVIDER=manual).
 * Admin pul kelganini tasdiqlaydi — shundan keyin jo’natmalar "to’langan" bo’ladi va
 * sotuvchilarga Telegram orqali xabar ketadi. Har doim auditga yoziladi.
 */
export function AdminConfirmPayment({ order }: { order: Order }) {
  const router = useRouter();
  const { getToken } = useSession();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await request(`/admin/orders/${order.id}/confirm-payment`, {
        method: 'POST',
        token,
        body: { reason },
      });
      setReason('');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'To’lovni tasdiqlab bo’lmadi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error ? <Alert tone="warning">{error}</Alert> : null}
      <p className="text-sm text-accent/70">
        Buyurtma summasi:{' '}
        <span className="font-semibold text-accent">
          {formatMoney(order.total_amount_minor, order.currency)}
        </span>
        . Pul hisobga tushgani yoki naqd olinganiga ishonch hosil qilgandan keyingina tasdiqlang.
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Input
          label="Qanday to’landi"
          required
          minLength={3}
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          hint="Masalan: to’lov topshirig’i raqami yoki «naqd, kuryer orqali»."
        />
        <Button type="submit" loading={busy} disabled={reason.trim().length < 3}>
          To’lovni tasdiqlash
        </Button>
      </div>
    </form>
  );
}
