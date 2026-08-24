'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert, Button, Card, Input, Textarea } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';
import { ApiError, request } from '@/lib/api-client';
import type { SellerAccount } from '@/lib/api-client/endpoints';

export function SellerSettingsForm({ account }: { account: SellerAccount }) {
  const router = useRouter();
  const { getToken } = useSession();
  const [form, setForm] = useState({
    business_name: account.business_name,
    contact_email: account.contact_email,
    description: account.description ?? '',
    license_number: account.license_number ?? '',
    tax_id: account.tax_id ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const token = await getToken();
      await request('/seller/me', { method: 'PATCH', body: form, token });
      setSaved(true);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'O’zgarishlarni saqlab bo’lmadi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={submit} className="space-y-4">
        {error ? (
          <Alert tone="warning" title="Saqlanmadi">
            {error}
          </Alert>
        ) : null}
        {saved ? <Alert tone="success" title="Saqlandi" /> : null}

        <Input
          label="Tashkilot nomi"
          required
          value={form.business_name}
          onChange={(event) => setForm({ ...form, business_name: event.target.value })}
        />
        <Input
          label="Aloqa uchun pochta"
          type="email"
          required
          value={form.contact_email}
          onChange={(event) => setForm({ ...form, contact_email: event.target.value })}
        />
        <Textarea
          label="Do’kon tavsifi"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Litsenziya raqami"
            value={form.license_number}
            onChange={(event) => setForm({ ...form, license_number: event.target.value })}
          />
          <Input
            label="STIR"
            value={form.tax_id}
            onChange={(event) => setForm({ ...form, tax_id: event.target.value })}
          />
        </div>

        <Button type="submit" loading={busy}>
          O’zgarishlarni saqlash
        </Button>
      </form>
    </Card>
  );
}
