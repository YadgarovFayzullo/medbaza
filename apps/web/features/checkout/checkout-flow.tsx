'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, CreditCard, FileText, MapPin, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { OrderSummary } from '@/features/cart/cart-view';
import { useCart } from '@/features/cart/cart-provider';
import { useSession } from '@/features/auth/session-provider';
import { requestWithHeaders } from '@/features/cart/api';
import { Alert, Button, Card, Input, Select, Spinner } from '@/components/ui';
import { ApiError } from '@/lib/api-client';
import type { Address, CheckoutResponse, Prescription } from '@/lib/api-client/endpoints';
import { cn } from '@/lib/utils/cn';

type StepId = 'contact' | 'shipping' | 'prescription' | 'review';

interface Step {
  id: StepId;
  label: string;
  icon: LucideIcon;
}

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

const EMPTY_ADDRESS = {
  recipient_name: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postal_code: '',
  country: 'US',
  phone: '',
};

export function CheckoutFlow() {
  const router = useRouter();
  const { cart, isLoading, refresh } = useCart();
  const { user, ready, getToken } = useSession();

  const [step, setStep] = useState<StepId>('contact');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState({ ...EMPTY_ADDRESS });
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [uploading, setUploading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Butun urinish uchun bitta kalit: qayta yuborish ikkinchi buyurtma yaratmasligi kerak (§5.6).
  const idempotencyKey = useRef(crypto.randomUUID());

  const needsPrescription = cart?.prescription_required ?? false;

  const steps = useMemo<Step[]>(() => {
    const base: Step[] = [
      { id: 'contact', label: 'Aloqa', icon: User },
      { id: 'shipping', label: 'Yetkazish', icon: MapPin },
    ];
    if (needsPrescription) base.push({ id: 'prescription', label: 'Retsept', icon: FileText });
    base.push({ id: 'review', label: 'Tekshirish va to’lov', icon: CreditCard });
    return base;
  }, [needsPrescription]);

  useEffect(() => {
    if (!ready) return;
    if (!user) return;
    setEmail(user.email);
    setAddress((current) => ({
      ...current,
      recipient_name: current.recipient_name || user.full_name,
    }));

    void (async () => {
      const token = await getToken();
      if (!token) return;
      const [addressResult, prescriptionResult] = await Promise.allSettled([
        requestWithHeaders<Address[]>('/account/addresses', { token }),
        requestWithHeaders<{ items: Prescription[] }>('/prescriptions', { token }),
      ]);
      if (addressResult.status === 'fulfilled') {
        setSavedAddresses(addressResult.value.data);
        const preferred =
          addressResult.value.data.find((row) => row.is_default) ?? addressResult.value.data[0];
        if (preferred) applyAddress(preferred);
      }
      if (prescriptionResult.status === 'fulfilled') {
        setPrescriptions(prescriptionResult.value.data.items);
      }
    })();
    // `getToken` is stable; re-running on user change is the intent.
  }, [ready, user, getToken]);

  function applyAddress(row: Address) {
    setAddress({
      recipient_name: row.recipient_name,
      line1: row.line1,
      line2: row.line2 ?? '',
      city: row.city,
      region: row.region ?? '',
      postal_code: row.postal_code,
      country: row.country,
      phone: row.phone ?? '',
    });
  }

  async function uploadPrescription(file: File) {
    setUploading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Retsept yuklash uchun tizimga kiring.');
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await requestWithHeaders<Prescription>('/prescriptions', {
        method: 'POST',
        formData,
        token,
      });
      setPrescriptions((current) => [data, ...current]);
      setPrescriptionId(data.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Yuklab bo’lmadi.');
    } finally {
      setUploading(false);
    }
  }

  async function placeOrder() {
    setPlacing(true);
    setError(null);
    setFieldErrors({});
    try {
      const token = await getToken();
      const { data } = await requestWithHeaders<CheckoutResponse>('/checkout', {
        method: 'POST',
        token,
        headers: { 'Idempotency-Key': idempotencyKey.current },
        body: {
          shipping_address: {
            ...address,
            line2: address.line2 || null,
            region: address.region || null,
            phone: address.phone || null,
          },
          email: user ? undefined : email,
          prescription_id: prescriptionId,
        },
      });
      await refresh();
      router.push(`/checkout/confirm?order=${data.order.id}&number=${data.order.number}`);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors(caught.fieldErrors);
        // Qoldiq o‘zgardi: endi savat ko‘rinishi asosiy manba.
        if (caught.code === 'INSUFFICIENT_STOCK') await refresh();
      } else {
        setError('Buyurtmani rasmiylashtirib bo’lmadi. Qayta urinib ko’ring.');
      }
      setPlacing(false);
    }
  }

  if (isLoading || !ready) return <Spinner className="text-primary-ink" />;

  if (!cart || cart.item_count === 0) {
    return (
      <Alert tone="info" title="Savatingiz bo’sh">
        Rasmiylashtirishdan oldin mahsulot qo’shing.
      </Alert>
    );
  }

  const stepIndex = steps.findIndex((candidate) => candidate.id === step);
  const contactValid = Boolean(user) || /.+@.+\..+/.test(email);
  const addressValid =
    address.recipient_name.trim() &&
    address.line1.trim() &&
    address.city.trim() &&
    address.postal_code.trim() &&
    address.country;
  const prescriptionValid = !needsPrescription || Boolean(prescriptionId);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {/* Step rail */}
        <ol className="flex flex-wrap gap-2">
          {steps.map((candidate, index) => (
            <li key={candidate.id} className="flex-1">
              <button
                type="button"
                onClick={() => index <= stepIndex && setStep(candidate.id)}
                disabled={index > stepIndex}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm',
                  index === stepIndex
                    ? 'border-primary-ink/50 bg-primary/5 font-medium text-accent'
                    : index < stepIndex
                      ? 'border-accent/15 bg-white text-accent/70'
                      : 'border-accent/10 bg-base text-accent/40',
                )}
              >
                {index < stepIndex ? (
                  <Check className="h-4 w-4 text-primary-ink" aria-hidden />
                ) : (
                  <candidate.icon className="h-4 w-4" aria-hidden />
                )}
                <span className="truncate">{candidate.label}</span>
              </button>
            </li>
          ))}
        </ol>

        {error ? (
          <Alert tone="warning" title="Davom eta olmadik">
            {error}
          </Alert>
        ) : null}

        <Card className="p-6">
          {step === 'contact' ? (
            <div className="space-y-5">
              <h2 className="text-lg font-medium">Aloqa ma’lumotlari</h2>
              {user ? (
                <p className="text-sm text-accent/70">
                  <span className="font-medium text-accent">{user.email}</span> sifatida kirgansiz.
                  Buyurtma hisobingiz tarixida ko’rinadi.
                </p>
              ) : (
                <>
                  <Input
                    label="Elektron pochta"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    hint="Buyurtma yangiliklari shu manzilga yuboriladi. Mehmon buyurtmasi raqam va pochta orqali kuzatiladi."
                    error={fieldErrors.email}
                  />
                  <p className="text-sm text-accent/60">
                    Hisob ochishni istaysizmi?{' '}
                    <a
                      href="/login?next=/checkout"
                      className="font-medium text-primary-ink hover:underline"
                    >
                      Kirish
                    </a>{' '}
                    — savatingiz siz bilan qoladi.
                  </p>
                </>
              )}
              <Button onClick={() => setStep('shipping')} disabled={!contactValid}>
                Yetkazishga o’tish
              </Button>
            </div>
          ) : null}

          {step === 'shipping' ? (
            <div className="space-y-5">
              <h2 className="text-lg font-medium">Yetkazib berish manzili</h2>

              {savedAddresses.length > 0 ? (
                <Select
                  label="Saqlangan manzildan foydalanish"
                  onChange={(event) => {
                    const found = savedAddresses.find((row) => row.id === event.target.value);
                    if (found) applyAddress(found);
                  }}
                >
                  <option value="">Yangi manzil kiritish</option>
                  {savedAddresses.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.label} — {row.line1}, {row.city}
                    </option>
                  ))}
                </Select>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Qabul qiluvchi ismi"
                  className="sm:col-span-2"
                  autoComplete="name"
                  value={address.recipient_name}
                  onChange={(event) =>
                    setAddress({ ...address, recipient_name: event.target.value })
                  }
                  error={fieldErrors['shipping_address.recipient_name']}
                />
                <Input
                  label="Manzil, 1-qator"
                  className="sm:col-span-2"
                  autoComplete="address-line1"
                  value={address.line1}
                  onChange={(event) => setAddress({ ...address, line1: event.target.value })}
                  error={fieldErrors['shipping_address.line1']}
                />
                <Input
                  label="Manzil, 2-qator (ixtiyoriy)"
                  className="sm:col-span-2"
                  autoComplete="address-line2"
                  value={address.line2}
                  onChange={(event) => setAddress({ ...address, line2: event.target.value })}
                />
                <Input
                  label="Shahar"
                  autoComplete="address-level2"
                  value={address.city}
                  onChange={(event) => setAddress({ ...address, city: event.target.value })}
                  error={fieldErrors['shipping_address.city']}
                />
                <Input
                  label="Viloyat (ixtiyoriy)"
                  autoComplete="address-level1"
                  value={address.region}
                  onChange={(event) => setAddress({ ...address, region: event.target.value })}
                />
                <Input
                  label="Pochta indeksi"
                  autoComplete="postal-code"
                  value={address.postal_code}
                  onChange={(event) => setAddress({ ...address, postal_code: event.target.value })}
                  error={fieldErrors['shipping_address.postal_code']}
                />
                <Select
                  label="Davlat"
                  autoComplete="country"
                  value={address.country}
                  onChange={(event) => setAddress({ ...address, country: event.target.value })}
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
                  autoComplete="tel"
                  className="sm:col-span-2"
                  value={address.phone}
                  onChange={(event) => setAddress({ ...address, phone: event.target.value })}
                  hint="Faqat kuryer uchun. Sotuvchiga yetkazishdan ortiq ma’lumot berilmaydi."
                />
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep('contact')}>
                  Orqaga
                </Button>
                <Button
                  disabled={!addressValid}
                  onClick={() => setStep(needsPrescription ? 'prescription' : 'review')}
                >
                  Davom etish
                </Button>
              </div>
            </div>
          ) : null}

          {step === 'prescription' ? (
            <div className="space-y-5">
              <h2 className="text-lg font-medium">Retsept</h2>
              <Alert tone="info" title="Jo’natishdan oldin tekshiriladi">
                Hujjatingiz shifrlangan holda saqlanadi va faqat litsenziyalangan mutaxassislar
                ko’radi — sotuvchi hech qachon ko’rmaydi.
              </Alert>

              {!user ? (
                <Alert tone="warning" title="Hisob kerak">
                  Retsept bo’yicha mahsulotlar uchun hisob kerak — tekshiruv sizga biriktiriladi.{' '}
                  <a
                    href="/login?next=/checkout"
                    className="font-medium text-primary-ink hover:underline"
                  >
                    Kirish
                  </a>
                </Alert>
              ) : (
                <>
                  {prescriptions.length > 0 ? (
                    <Select
                      label="Mavjud retseptdan foydalanish"
                      value={prescriptionId ?? ''}
                      onChange={(event) => setPrescriptionId(event.target.value || null)}
                    >
                      <option value="">Yangisini yuklash</option>
                      {prescriptions.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.original_filename} — {row.status.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </Select>
                  ) : null}

                  <div className="space-y-1.5">
                    <label htmlFor="rx-file" className="block text-sm font-medium">
                      Retsept yuklash
                    </label>
                    <input
                      id="rx-file"
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/heic"
                      disabled={uploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadPrescription(file);
                      }}
                      className="w-full rounded-lg border border-dashed border-accent/25 bg-base px-3 py-6 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary-ink file:px-3 file:py-1.5 file:text-sm file:text-white"
                    />
                    <p className="text-xs text-accent/60">PDF yoki rasm, 10 MB gacha.</p>
                  </div>
                  {uploading ? (
                    <p className="flex items-center gap-2 text-sm text-accent/60">
                      <Spinner className="text-primary-ink" /> Yuklanmoqda…
                    </p>
                  ) : null}
                </>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep('shipping')}>
                  Orqaga
                </Button>
                <Button disabled={!prescriptionValid} onClick={() => setStep('review')}>
                  Davom etish
                </Button>
              </div>
            </div>
          ) : null}

          {step === 'review' ? (
            <div className="space-y-5">
              <h2 className="text-lg font-medium">Tekshiring va to’lang</h2>

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-accent/50">Aloqa</dt>
                  <dd className="font-medium">{user?.email ?? email}</dd>
                </div>
                <div>
                  <dt className="text-accent/50">Yetkazish manzili</dt>
                  <dd className="font-medium">
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
                  </dd>
                </div>
                {needsPrescription ? (
                  <div>
                    <dt className="text-accent/50">Retsept</dt>
                    <dd className="font-medium">
                      {prescriptions.find((row) => row.id === prescriptionId)?.original_filename ??
                        'Biriktirilgan'}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <Alert tone="info" title="To’lov">
                Buyurtmani yakunlash uchun tashqi to’lov sahifasiga o’tasiz. MedBaza karta
                ma’lumotlaringizni hech qachon ko’rmaydi.
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setStep(needsPrescription ? 'prescription' : 'shipping')}
                >
                  Orqaga
                </Button>
                <Button size="lg" loading={placing} onClick={placeOrder}>
                  Buyurtma berish
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <OrderSummary
        itemsAmountMinor={cart.items_amount_minor}
        shippingAmountMinor={cart.shipping_amount_minor}
        totalAmountMinor={cart.total_amount_minor}
        currency={cart.currency}
        sellerCount={cart.groups.length}
        prescriptionRequired={cart.prescription_required}
        action={<span className="sr-only">Buyurtma berish uchun bosqichlarni yakunlang</span>}
      />
    </div>
  );
}
