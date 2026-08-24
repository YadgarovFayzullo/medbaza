'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert, Button, Card, Checkbox, Input, Select, Textarea } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';
import { ApiError, request } from '@/lib/api-client';
import type { CategoryTree, Product } from '@/lib/api-client/endpoints';
import {
  SITE_CURRENCY,
  currencySymbol,
  fromMinor,
  minorUnitExponent,
  toMinor,
} from '@/lib/utils/money';

const CERTIFICATIONS = ['CE', 'FDA', 'ISO'] as const;

// Bo‘limlar: API ularning ostidagi e’lonni sertifikatsiz chop etmaydi (§5.5).
// Mirrors REGULATED_CATEGORY_SLUGS on the API, which is the enforcement point.
const REGULATED_DEPARTMENTS = new Set(['ppe', 'first-aid']);

/**
 * Flattens the tree and marks every node that sits under a regulated
 * department, so a leaf like "masks-respirators" inherits the requirement
 * rather than each leaf having to be listed.
 */
function flatten(
  tree: CategoryTree[],
  depth = 0,
  regulated = false,
): Array<{ id: string; label: string; regulated: boolean }> {
  return tree.flatMap((node) => {
    const nodeRegulated = regulated || REGULATED_DEPARTMENTS.has(node.slug);
    return [
      { id: node.id, label: `${'— '.repeat(depth)}${node.name}`, regulated: nodeRegulated },
      ...flatten(node.children ?? [], depth + 1, nodeRegulated),
    ];
  });
}

export function ListingForm({
  categories,
  product,
}: {
  categories: CategoryTree[];
  product?: Product;
}) {
  const router = useRouter();
  const { getToken } = useSession();
  const options = flatten(categories);
  // An existing listing keeps the currency it was created in; a new one takes
  // the catalog's. The step and the ×/÷ both follow from that, not from an
  // assumption that every currency has two decimals.
  const currency = product?.currency ?? SITE_CURRENCY;
  const priceStep = String(10 ** -minorUnitExponent(currency));

  const [form, setForm] = useState({
    name: product?.name ?? '',
    category_id: product?.category.id ?? options[0]?.id ?? '',
    sku: product?.sku ?? '',
    brand: product?.brand ?? '',
    description: product?.description ?? '',
    price: product ? String(fromMinor(product.price_amount_minor, currency)) : '',
    stock: product ? String(product.stock) : '0',
    unit_label: product?.unit_label ?? 'dona',
    certifications: new Set<string>(product?.certifications ?? []),
    prescription_required: product?.prescription_required ?? false,
    status: product?.status === 'active' ? 'active' : 'draft',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const selectedRegulated =
    options.find((option) => option.id === form.category_id)?.regulated ?? false;
  const needsCertification =
    selectedRegulated && form.status === 'active' && form.certifications.size === 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});

    const body = {
      name: form.name,
      category_id: form.category_id,
      brand: form.brand || null,
      description: form.description,
      price_amount_minor: toMinor(Number(form.price), currency),
      stock: Number(form.stock),
      unit_label: form.unit_label,
      certifications: [...form.certifications],
      prescription_required: form.prescription_required,
      status: form.status,
      ...(product ? {} : { sku: form.sku, currency }),
    };

    try {
      const token = await getToken();
      const saved = await request<Product>(
        product ? `/seller/products/${product.id}` : '/seller/products',
        { method: product ? 'PATCH' : 'POST', body, token },
      );
      router.push(`/seller/listings/${saved.id}`);
      router.refresh();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors(caught.fieldErrors);
      } else {
        setError('E’lonni saqlab bo’lmadi.');
      }
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={submit} className="space-y-5">
        {error ? (
          <Alert tone="warning" title="E’lon saqlanmadi">
            {error}
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Mahsulot nomi"
            required
            className="sm:col-span-2"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            error={fieldErrors.name}
          />
          <Select
            label="Turkum"
            value={form.category_id}
            onChange={(event) => setForm({ ...form, category_id: event.target.value })}
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
          <Input
            label="Brend (ixtiyoriy)"
            value={form.brand}
            onChange={(event) => setForm({ ...form, brand: event.target.value })}
          />
          {!product ? (
            <Input
              label="SKU"
              required
              value={form.sku}
              onChange={(event) => setForm({ ...form, sku: event.target.value })}
              hint="Sizning katalogingizda takrorlanmas bo’lishi kerak."
              error={fieldErrors.sku}
            />
          ) : (
            <Input label="SKU" value={product.sku} disabled hint="SKU o’zgartirilmaydi." />
          )}
          <Input
            label="O’lchov birligi"
            value={form.unit_label}
            onChange={(event) => setForm({ ...form, unit_label: event.target.value })}
            hint="quti, to’plam, dona…"
          />
          <Input
            label={`Narx (${currencySymbol(currency)})`}
            type="number"
            step={priceStep}
            min="0"
            required
            value={form.price}
            onChange={(event) => setForm({ ...form, price: event.target.value })}
            error={fieldErrors.price_amount_minor}
          />
          <Input
            label="Qoldiq"
            type="number"
            min="0"
            required
            value={form.stock}
            onChange={(event) => setForm({ ...form, stock: event.target.value })}
          />
        </div>

        <Textarea
          label="Tavsif"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          className="min-h-32"
        />

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Sertifikatlar</legend>
          <div className="flex flex-wrap gap-4">
            {CERTIFICATIONS.map((certification) => (
              <Checkbox
                key={certification}
                label={certification}
                checked={form.certifications.has(certification)}
                onChange={(event) => {
                  const next = new Set(form.certifications);
                  if (event.target.checked) next.add(certification);
                  else next.delete(certification);
                  setForm({ ...form, certifications: next });
                }}
              />
            ))}
          </div>
          {needsCertification ? (
            <p className="mt-2 text-xs font-medium text-accent">
              Bu turkumda efirga chiqish uchun kamida bitta sertifikat kerak.
            </p>
          ) : null}
        </fieldset>

        <Checkbox
          label="Bu mahsulot retsept talab qiladi"
          checked={form.prescription_required}
          onChange={(event) => setForm({ ...form, prescription_required: event.target.checked })}
        />

        <Select
          label="Ko’rinishi"
          value={form.status}
          onChange={(event) => setForm({ ...form, status: event.target.value })}
        >
          <option value="draft">Qoralama — xaridorlarga ko’rinmaydi</option>
          <option value="active">Efirda — do’konda ko’rinadi</option>
        </Select>

        <Button type="submit" size="lg" loading={busy} disabled={needsCertification}>
          {product ? 'O’zgarishlarni saqlash' : 'E’lon yaratish'}
        </Button>
      </form>
    </Card>
  );
}
