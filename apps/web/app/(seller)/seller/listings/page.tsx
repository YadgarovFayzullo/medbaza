import Link from 'next/link';
import { Package } from 'lucide-react';

import { PageHeader } from '@/components/domain/section';
import { StatusBadge } from '@/components/domain/status-badge';
import { ButtonLink, EmptyState, TableWrap, Td, Th } from '@/components/ui';
import { seller } from '@/lib/api-client/endpoints';
import { requireSession } from '@/lib/auth/guards';
import { formatMoney } from '@/lib/utils/money';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'E’lonlar' };

const FILTERS = [
  { label: 'Barchasi', value: '' },
  { label: 'Efirda', value: 'active' },
  { label: 'Qoralama', value: 'draft' },
  { label: 'Arxiv', value: 'archived' },
];

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: { status?: string; cursor?: string };
}) {
  const session = await requireSession('/seller/listings');
  const page = await seller.products(session.accessToken, {
    status: searchParams.status,
    cursor: searchParams.cursor,
  });

  return (
    <div>
      <PageHeader
        title="E’lonlar"
        description="Siz sotayotgan hamma narsa — qoralama va arxivdagilar bilan birga."
        actions={<ButtonLink href="/seller/listings/new">Yangi e’lon</ButtonLink>}
      />

      <ul className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <li key={filter.label}>
            <Link
              href={filter.value ? `/seller/listings?status=${filter.value}` : '/seller/listings'}
              className={`inline-block rounded-full border px-3.5 py-1.5 text-sm ${
                (searchParams.status ?? '') === filter.value
                  ? 'border-primary-ink/50 bg-primary/10 font-medium text-primary-ink'
                  : 'border-accent/15 bg-white text-accent/70 hover:border-accent/30'
              }`}
            >
              {filter.label}
            </Link>
          </li>
        ))}
      </ul>

      {page.items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Bu yerda e’lon yo’q"
          description="Sotishni boshlash uchun birinchi e’lonni yarating."
          action={<ButtonLink href="/seller/listings/new">Yangi e’lon</ButtonLink>}
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Mahsulot</Th>
              <Th>SKU</Th>
              <Th>Holat</Th>
              <Th className="text-right">Narx</Th>
              <Th className="text-right">Qoldiq</Th>
            </tr>
          </thead>
          <tbody>
            {page.items.map((product) => (
              <tr key={product.id}>
                <Td>
                  <Link
                    href={`/seller/listings/${product.id}`}
                    className="font-medium text-primary-ink hover:underline"
                  >
                    {product.name}
                  </Link>
                  {product.prescription_required ? (
                    <span className="ml-2 text-xs text-accent/50">Rx</span>
                  ) : null}
                </Td>
                <Td className="text-accent/60">{product.id.slice(0, 8)}</Td>
                <Td>
                  <StatusBadge status={product.in_stock ? 'active' : 'draft'} />
                </Td>
                <Td className="text-right">
                  {formatMoney(product.price_amount_minor, product.currency)}
                </Td>
                <Td className="text-right">
                  <span className={product.stock <= 5 ? 'font-medium text-primary-ink' : ''}>
                    {product.stock}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {page.next_cursor ? (
        <div className="flex justify-center pt-6">
          <ButtonLink
            variant="secondary"
            href={`/seller/listings?${new URLSearchParams({
              ...(searchParams.status ? { status: searchParams.status } : {}),
              cursor: page.next_cursor,
            })}`}
          >
            Yana ko’rsatish
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
