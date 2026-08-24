'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert, Button, Input } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';
import { ApiError, request } from '@/lib/api-client';

/** Sotuvchini tasdiqlash, rad etish yoki to‘xtatish. Har bir qaror auditga yoziladi (§12.3). */
export function VerificationActions({ sellerId, status }: { sellerId: string; status: string }) {
  const router = useRouter();
  const { getToken } = useSession();
  const [pending, setPending] = useState<'rejected' | 'suspended' | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(next: string, withReason?: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await request(`/admin/sellers/${sellerId}/verification`, {
        method: 'POST',
        token,
        body: { status: next, reason: withReason || null },
      });
      setPending(null);
      setReason('');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Sotuvchini yangilab bo’lmadi.');
    } finally {
      setBusy(false);
    }
  }

  if (pending) {
    return (
      <div className="space-y-2">
        {error ? <Alert tone="warning">{error}</Alert> : null}
        <Input
          label={pending === 'rejected' ? 'Rad etish sababi' : 'To’xtatish sababi'}
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          hint="Buni sotuvchi ko’radi — aniq va bajarib bo’ladigan qilib yozing."
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            loading={busy}
            disabled={reason.trim().length === 0}
            onClick={() => submit(pending, reason)}
          >
            Tasdiqlash
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
            Bekor qilish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error ? <Alert tone="warning">{error}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        {status !== 'verified' ? (
          <Button size="sm" loading={busy} onClick={() => submit('verified')}>
            Tasdiqlash
          </Button>
        ) : null}
        {status === 'pending' ? (
          <Button size="sm" variant="secondary" onClick={() => setPending('rejected')}>
            Rad etish
          </Button>
        ) : null}
        {status === 'verified' ? (
          <Button size="sm" variant="secondary" onClick={() => setPending('suspended')}>
            To’xtatish
          </Button>
        ) : null}
      </div>
    </div>
  );
}
