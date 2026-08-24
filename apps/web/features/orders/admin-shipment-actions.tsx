'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert, Button, Input, Select } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';
import { ApiError, request } from '@/lib/api-client';
import type { Shipment } from '@/lib/api-client/endpoints';

const OPTIONS = [
  { value: 'processing', label: 'Tayyorlanmoqda' },
  { value: 'shipped', label: 'Jo’natildi' },
  { value: 'delivered', label: 'Yetkazildi' },
  { value: 'cancelled', label: 'Bekor qilindi' },
];

/** Admin tomonidan holatni majburan o‘zgartirish. Har doim auditga yoziladi. */
export function AdminShipmentActions({ shipment }: { shipment: Shipment }) {
  const router = useRouter();
  const { getToken } = useSession();
  const [toStatus, setToStatus] = useState(OPTIONS[0]!.value);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await request(`/admin/shipments/${shipment.id}/transition`, {
        method: 'POST',
        token,
        body: { to_status: toStatus, reason },
      });
      setReason('');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Jo’natmani o’zgartirib bo’lmadi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error ? <Alert tone="warning">{error}</Alert> : null}
      <div className="grid gap-3 sm:grid-cols-[160px_1fr_auto] sm:items-end">
        <Select
          label="Yangi holat"
          value={toStatus}
          onChange={(event) => setToStatus(event.target.value)}
        >
          {OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input
          label="Sabab"
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          hint="Buyurtmada va audit jurnalida qayd etiladi."
        />
        <Button type="submit" loading={busy} disabled={reason.trim().length === 0}>
          Qo’llash
        </Button>
      </div>
    </form>
  );
}
