'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MapPin, Trash2 } from 'lucide-react';

import { Alert, Button, Card, Checkbox, EmptyState, Input, Select } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';
import { ApiError, request } from '@/lib/api-client';
import type { Address } from '@/lib/api-client/endpoints';

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

const EMPTY = {
  label: 'Uy',
  recipient_name: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postal_code: '',
  country: 'UZ',
  phone: '',
  is_default: false,
};

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const { getToken } = useSession();
  const [form, setForm] = useState({ ...EMPTY });
  const [adding, setAdding] = useState(addresses.length === 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await request('/account/addresses', {
        method: 'POST',
        token,
        body: {
          ...form,
          line2: form.line2 || null,
          region: form.region || null,
          phone: form.phone || null,
        },
      });
      setForm({ ...EMPTY });
      setAdding(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Manzilni saqlab bo’lmadi.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await request(`/account/addresses/${id}`, { method: 'DELETE', token });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Manzilni o’chirib bo’lmadi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert tone="warning" title="Manzillar yangilanmadi">
          {error}
        </Alert>
      ) : null}

      {addresses.length === 0 && !adding ? (
        <EmptyState
          icon={MapPin}
          title="Saqlangan manzillar yo’q"
          description="Rasmiylashtirishni tezlashtirish uchun manzil saqlang. Buyurtma o’z nusxasini saqlaydi, shuning uchun bu yerdagi tahrir eski buyurtmani o’zgartirmaydi."
          action={<Button onClick={() => setAdding(true)}>Manzil qo’shish</Button>}
        />
      ) : null}

      {addresses.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card as="li" key={address.id} className="flex justify-between gap-4 p-5">
              <div className="space-y-1 text-sm">
                <p className="font-semibold">
                  {address.label}
                  {address.is_default ? (
                    <span className="ml-2 text-xs font-normal text-primary-ink">Asosiy</span>
                  ) : null}
                </p>
                <p className="text-accent/70">
                  {address.recipient_name}
                  <br />
                  {address.line1}
                  {address.line2 ? (
                    <>
                      <br />
                      {address.line2}
                    </>
                  ) : null}
                  <br />
                  {address.city}
                  {address.region ? `, ${address.region}` : ''} {address.postal_code}
                  <br />
                  {address.country}
                </p>
              </div>
              <button
                type="button"
                aria-label={`${address.label} manzilini o’chirish`}
                disabled={busy}
                onClick={() => remove(address.id)}
                className="h-fit rounded-lg p-2 text-accent/40 hover:bg-base hover:text-accent disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </Card>
          ))}
        </ul>
      ) : null}

      {adding ? (
        <Card className="p-6">
          <h2 className="text-lg font-medium">Manzil qo’shish</h2>
          <form onSubmit={create} className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input
              label="Nomi"
              value={form.label}
              onChange={(event) => setForm({ ...form, label: event.target.value })}
            />
            <Input
              label="Qabul qiluvchi ismi"
              required
              value={form.recipient_name}
              onChange={(event) => setForm({ ...form, recipient_name: event.target.value })}
            />
            <Input
              label="Manzil, 1-qator"
              required
              className="sm:col-span-2"
              value={form.line1}
              onChange={(event) => setForm({ ...form, line1: event.target.value })}
            />
            <Input
              label="Manzil, 2-qator (ixtiyoriy)"
              className="sm:col-span-2"
              value={form.line2}
              onChange={(event) => setForm({ ...form, line2: event.target.value })}
            />
            <Input
              label="Shahar"
              required
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
            />
            <Input
              label="Viloyat (ixtiyoriy)"
              value={form.region}
              onChange={(event) => setForm({ ...form, region: event.target.value })}
            />
            <Input
              label="Pochta indeksi"
              required
              value={form.postal_code}
              onChange={(event) => setForm({ ...form, postal_code: event.target.value })}
            />
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
              label="Telefon (ixtiyoriy)"
              type="tel"
              className="sm:col-span-2"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
            <div className="sm:col-span-2">
              <Checkbox
                label="Asosiy manzil sifatida ishlatish"
                checked={form.is_default}
                onChange={(event) => setForm({ ...form, is_default: event.target.checked })}
              />
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit" loading={busy}>
                Manzilni saqlash
              </Button>
              {addresses.length > 0 ? (
                <Button variant="ghost" onClick={() => setAdding(false)}>
                  Bekor qilish
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      ) : (
        <Button variant="secondary" onClick={() => setAdding(true)}>
          Yana manzil qo’shish
        </Button>
      )}
    </div>
  );
}
