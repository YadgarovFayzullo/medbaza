'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert, Button, Card, Input, Select, Textarea } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';
import { ApiError, request } from '@/lib/api-client';

const COUNTRIES = [
  ['UZ', 'O’zbekiston'],
  ['KZ', 'Qozog’iston'],
  ['KG', 'Qirg’iziston'],
  ['TJ', 'Tojikiston'],
  ['RU', 'Rossiya'],
  ['TR', 'Turkiya'],
  ['DE', 'Germaniya'],
  ['US', 'AQSH'],
] as const;

export function SellerApplicationForm() {
  const router = useRouter();
  const { getToken } = useSession();
  const [form, setForm] = useState({
    business_name: '',
    country: 'UZ',
    contact_email: '',
    description: '',
    license_number: '',
    tax_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      await request('/sellers/apply', { method: 'POST', body: form, token });
      setDone(true);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Arizani yuborib bo’lmadi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Alert tone="success" title="Ariza qabul qilindi">
        Muvofiqlik guruhi litsenziya va sertifikat hujjatlarini tekshiradi. Tasdiqlangach, e’lon
        joylashingiz mumkin bo’ladi.
      </Alert>
    );
  }

  return (
    <Card className="p-8">
      <h2 className="text-lg font-medium">Sotuvchi bo’lish uchun ariza</h2>
      <p className="mt-1.5 text-sm text-accent/60">
        Ariza o’zi hech narsa bermaydi — e’lon efirga chiqishidan oldin admin hisobni tasdiqlaydi.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {error ? (
          <Alert tone="warning" title="Yuborib bo’lmadi">
            {error}
          </Alert>
        ) : null}

        <Input
          label="Tashkilot nomi"
          required
          value={form.business_name}
          onChange={(event) => setForm({ ...form, business_name: event.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Davlat"
            value={form.country}
            onChange={(event) => setForm({ ...form, country: event.target.value })}
          >
            {COUNTRIES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </Select>
          <Input
            label="Aloqa uchun pochta"
            type="email"
            required
            value={form.contact_email}
            onChange={(event) => setForm({ ...form, contact_email: event.target.value })}
          />
          <Input
            label="Litsenziya raqami"
            value={form.license_number}
            onChange={(event) => setForm({ ...form, license_number: event.target.value })}
            hint="Tekshiruv vaqtida ko’rib chiqiladi."
          />
          <Input
            label="STIR"
            value={form.tax_id}
            onChange={(event) => setForm({ ...form, tax_id: event.target.value })}
          />
        </div>
        <Textarea
          label="Tashkilot haqida"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          hint="Do’koningiz sahifasida ko’rsatiladi."
        />

        <Button type="submit" size="lg" loading={submitting}>
          Arizani yuborish
        </Button>
      </form>
    </Card>
  );
}
