'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

import { Button, Checkbox, Input } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { SITE_CURRENCY, currencySymbol } from '@/lib/utils/money';

const CERTIFICATIONS = ['CE', 'FDA', 'ISO'] as const;

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Mosligi bo’yicha' },
  { value: 'newest', label: 'Yangilari' },
  { value: 'price_asc', label: 'Avval arzoni' },
  { value: 'price_desc', label: 'Avval qimmati' },
  { value: 'rating', label: 'Reyting bo’yicha' },
] as const;

const FILTER_KEYS = [
  'brand',
  'certification',
  'min_price',
  'max_price',
  'in_stock',
  'rx',
  'on_sale',
];

/**
 * Filtrlar URL’da saqlanadi: filtrlangan ro’yxatni ulashish mumkin va yuqoridagi
 * Server Component uni klientda hech narsa yuklamasdan render qiladi.
 */
export function FilterPanel({ brands }: { brands: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      // Har qanday filtr o’zgarishi kursorni bekor qiladi.
      next.delete('cursor');
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  const activeCount = FILTER_KEYS.filter((key) => params.get(key)).length;

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="lg:hidden"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="filters"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        Filtrlar{activeCount > 0 ? ` (${activeCount})` : ''}
      </Button>

      <aside
        id="filters"
        aria-label="Mahsulot filtrlari"
        className={cn(
          // A well, not a bordered card: the grey step carries the separation now
          // that the listing beside it is borderless too. The controls inside keep
          // their own borders — §9 still wants 3:1 on a control boundary.
          'h-fit space-y-6 rounded-lg bg-base p-5 lg:block',
          // Follows the list down, clear of the sticky header. Only from lg:
          // below that the panel is a toggled drawer, not a column, and there
          // is nothing beside it to stay level with. A long brand list scrolls
          // inside the panel rather than pushing its own footer off screen.
          'lg:sticky lg:top-[var(--header-offset)]',
          'lg:max-h-[calc(100vh-var(--header-offset)-1.5rem)] lg:overflow-y-auto',
          open ? 'block' : 'hidden',
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-accent/60">Filtrlar</h2>
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={() => setParam(Object.fromEntries(FILTER_KEYS.map((key) => [key, null])))}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-ink hover:underline"
            >
              <X className="h-3 w-3" aria-hidden />
              Tozalash
            </button>
          ) : null}
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">
            Narx, {currencySymbol(SITE_CURRENCY)}
          </legend>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="dan"
              aria-label="Eng past narx"
              defaultValue={params.get('min_price') ?? ''}
              onBlur={(event) => setParam({ min_price: event.target.value })}
            />
            <span className="pt-1 text-accent/40">–</span>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="gacha"
              aria-label="Eng yuqori narx"
              defaultValue={params.get('max_price') ?? ''}
              onBlur={(event) => setParam({ max_price: event.target.value })}
            />
          </div>
        </fieldset>

        {brands.length > 0 ? (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">Brend</legend>
            <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
              {brands.map((brand) => (
                <Checkbox
                  key={brand}
                  label={brand}
                  checked={params.get('brand') === brand}
                  onChange={(event) => setParam({ brand: event.target.checked ? brand : null })}
                />
              ))}
            </div>
          </fieldset>
        ) : null}

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Sertifikat</legend>
          {CERTIFICATIONS.map((certification) => (
            <Checkbox
              key={certification}
              label={certification}
              checked={params.get('certification') === certification}
              onChange={(event) =>
                setParam({ certification: event.target.checked ? certification : null })
              }
            />
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Mavjudligi</legend>
          <Checkbox
            label="Faqat mavjudlari"
            checked={params.get('in_stock') === 'true'}
            onChange={(event) => setParam({ in_stock: event.target.checked ? 'true' : null })}
          />
          <Checkbox
            label="Chegirmadagilar"
            checked={params.get('on_sale') === 'true'}
            onChange={(event) => setParam({ on_sale: event.target.checked ? 'true' : null })}
          />
          <Checkbox
            label="Retsept talab qilinadi"
            checked={params.get('rx') === 'true'}
            onChange={(event) => setParam({ rx: event.target.checked ? 'true' : null })}
          />
          <Checkbox
            label="Retseptsiz"
            checked={params.get('rx') === 'false'}
            onChange={(event) => setParam({ rx: event.target.checked ? 'false' : null })}
          />
        </fieldset>
      </aside>
    </>
  );
}

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm text-accent/60">
      Saralash
      <select
        value={params.get('sort') ?? 'relevance'}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          next.set('sort', event.target.value);
          next.delete('cursor');
          router.push(`${pathname}?${next.toString()}`);
        }}
        className="rounded-lg border border-accent/15 bg-white px-3 py-2 text-sm text-accent focus:border-primary-ink/50 focus:outline-none focus:ring-2 focus:ring-primary-ink/30"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
