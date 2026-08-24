'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert, Button, Input, Select } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';
import { ApiError, request } from '@/lib/api-client';
import type { SellerShipment } from '@/lib/api-client/endpoints';

/**
 * Sotuvchi bajara oladigan o‘tishlar — API’dagi ruxsat etilgan o‘tishlar xaritasi
 * aksi. Qoidani API qo‘llaydi; bu yer faqat rad etiladigan variantni taklif
 * qilmaslik uchun (CLAUDE.md §5.4).
 */
const NEXT_STEPS: Record<string, Array<{ value: string; label: string }>> = {
  paid: [
    { value: 'processing', label: 'Tayyorlashni boshlash' },
    { value: 'cancelled', label: 'Bekor qilish (qoldiq qaytadi)' },
  ],
  processing: [
    { value: 'shipped', label: 'Jo’natildi deb belgilash' },
    { value: 'cancelled', label: 'Bekor qilish (qoldiq qaytadi)' },
  ],
  shipped: [{ value: 'delivered', label: 'Yetkazildi deb belgilash' }],
  return_requested: [{ value: 'delivered', label: 'Qaytarishni rad etish' }],
};

export function FulfilmentActions({ shipment }: { shipment: SellerShipment }) {
  const router = useRouter();
  const { getToken } = useSession();
  const steps = NEXT_STEPS[shipment.status] ?? [];

  const [toStatus, setToStatus] = useState(steps[0]?.value ?? '');
  const [carrier, setCarrier] = useState(shipment.carrier ?? '');
  const [tracking, setTracking] = useState(shipment.tracking_number ?? '');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (steps.length === 0) {
    return <p className="text-sm text-accent/60">Bu holatdan boshqa amal mavjud emas.</p>;
  }

  const shipping = toStatus === 'shipped';
  const cancelling = toStatus === 'cancelled';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await request(`/seller/shipments/${shipment.id}/transition`, {
        method: 'POST',
        token,
        body: {
          to_status: toStatus,
          carrier: shipping ? carrier || null : null,
          tracking_number: shipping ? tracking : null,
          reason: reason || null,
        },
      });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Jo’natmani yangilab bo’lmadi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? (
        <Alert tone="warning" title="Jo’natma yangilanmadi">
          {error}
        </Alert>
      ) : null}

      <Select
        label="Keyingi qadam"
        value={toStatus}
        onChange={(event) => setToStatus(event.target.value)}
      >
        {steps.map((step) => (
          <option key={step.value} value={step.value}>
            {step.label}
          </option>
        ))}
      </Select>

      {shipping ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Yetkazuvchi"
            value={carrier}
            onChange={(event) => setCarrier(event.target.value)}
            placeholder="DHL, UPS, BTS…"
          />
          <Input
            label="Kuzatuv raqami"
            required
            value={tracking}
            onChange={(event) => setTracking(event.target.value)}
            hint="Majburiy — xaridorlar har bir jo’natmani alohida kuzatadi."
          />
        </div>
      ) : null}

      {cancelling ? (
        <Input
          label="Sabab"
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          hint="Jo’natishdan oldin bekor qilinsa, qoldiq qaytadi."
        />
      ) : null}

      <Button type="submit" loading={busy} disabled={shipping && !tracking.trim()}>
        Jo’natmani yangilash
      </Button>
    </form>
  );
}
