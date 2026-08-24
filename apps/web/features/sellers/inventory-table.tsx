'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

import { Alert, Button, TableWrap, Td, Th } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';
import { ApiError, request } from '@/lib/api-client';
import type { ProductListItem } from '@/lib/api-client/endpoints';
import { formatMoney } from '@/lib/utils/money';

/**
 * Qoldiqni joyida tahrirlash. Har bir saqlash rasmiylashtirishdagi qator qulfidan
 * o‘tadi, shuning uchun tuzatish xarid bilan poyga qilmaydi (CLAUDE.md §5.3).
 */
export function InventoryTable({ products }: { products: ProductListItem[] }) {
  const { getToken } = useSession();
  const [levels, setLevels] = useState(
    () => new Map(products.map((product) => [product.id, product.stock])),
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(productId: string) {
    setSaving(productId);
    setError(null);
    try {
      const token = await getToken();
      const updated = await request<ProductListItem>('/seller/inventory', {
        method: 'PUT',
        token,
        body: { product_id: productId, stock: levels.get(productId) ?? 0 },
      });
      setLevels((current) => new Map(current).set(productId, updated.stock));
      setSaved(productId);
      setTimeout(() => setSaved(null), 2000);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Qoldiqni yangilab bo’lmadi.');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert tone="warning" title="Qoldiq yangilanmadi">
          {error}
        </Alert>
      ) : null}

      <TableWrap>
        <thead>
          <tr>
            <Th>Mahsulot</Th>
            <Th className="text-right">Narx</Th>
            <Th className="text-right">Qoldiq</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const value = levels.get(product.id) ?? 0;
            const changed = value !== product.stock;
            return (
              <tr key={product.id}>
                <Td>
                  <span className="font-medium">{product.name}</span>
                  {value === 0 ? (
                    <span className="ml-2 text-xs font-medium text-accent/50">Tugagan</span>
                  ) : value <= 5 ? (
                    <span className="ml-2 text-xs font-medium text-primary-ink">Kam qoldi</span>
                  ) : null}
                </Td>
                <Td className="text-right text-accent/60">
                  {formatMoney(product.price_amount_minor, product.currency)}
                </Td>
                <Td className="text-right">
                  <label className="sr-only" htmlFor={`stock-${product.id}`}>
                    {product.name} uchun qoldiq
                  </label>
                  <input
                    id={`stock-${product.id}`}
                    type="number"
                    min={0}
                    value={value}
                    onChange={(event) =>
                      setLevels((current) =>
                        new Map(current).set(
                          product.id,
                          Math.max(0, Number(event.target.value) || 0),
                        ),
                      )
                    }
                    className="w-24 rounded-lg border border-accent/15 bg-white px-2 py-1.5 text-right text-sm focus:border-primary-ink/50 focus:outline-none focus:ring-2 focus:ring-primary-ink/30"
                  />
                </Td>
                <Td className="text-right">
                  {saved === product.id ? (
                    <span className="inline-flex items-center gap-1 text-sm text-primary-ink">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      Saqlandi
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!changed}
                      loading={saving === product.id}
                      onClick={() => save(product.id)}
                    >
                      Saqlash
                    </Button>
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </TableWrap>
    </div>
  );
}
