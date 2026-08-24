import Link from 'next/link';
import { Truck } from 'lucide-react';

import { PageHeader } from '@/components/domain/section';
import { StatusBadge } from '@/components/domain/status-badge';
import { ButtonLink, EmptyState, TableWrap, Td, Th } from '@/components/ui';
import { seller } from '@/lib/api-client/endpoints';
import { requireSession } from '@/lib/auth/guards';
import { formatDate, formatMoney } from '@/lib/utils/money';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Buyurtmalar' };

const FILTERS = [
  { label: 'Barchasi', value: '' },
  { label: 'To’langan', value: 'paid' },
  { label: 'Tayyorlanmoqda', value: 'processing' },
  { label: 'Jo’natilgan', value: 'shipped' },
  { label: 'Yetkazilgan', value: 'delivered' },
  { label: 'Qaytarishlar', value: 'return_requested' },
];

export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; cursor?: string };
}) {
  const session = await requireSession('/seller/orders');
  const page = await seller.shipments(session.accessToken, {
    status: searchParams.status,
    cursor: searchParams.cursor,
  });

  return (
    <div>
      <PageHeader
        title="Bajarish uchun buyurtmalar"
        description="Siz faqat o’z jo’natmangizni ko’rasiz — xaridorning boshqa sotuvchilari yoki umumiy summasi emas."
      />

      <ul className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <li key={filter.label}>
            <Link
              href={filter.value ? `/seller/orders?status=${filter.value}` : '/seller/orders'}
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
          icon={Truck}
          title="Bajariladigan buyurtma yo’q"
          description="To’lov o’tishi bilan yangi buyurtmalar shu yerda paydo bo’ladi."
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Buyurtma</Th>
              <Th>Sana</Th>
              <Th>Manzil</Th>
              <Th>Holat</Th>
              <Th className="text-right">Mahsulot</Th>
              <Th className="text-right">To’lovingiz</Th>
            </tr>
          </thead>
          <tbody>
            {page.items.map((shipment) => (
              <tr key={shipment.id}>
                <Td>
                  <Link
                    href={`/seller/orders/${shipment.id}`}
                    className="font-medium text-primary-ink hover:underline"
                  >
                    {shipment.order_number}
                  </Link>
                </Td>
                <Td className="text-accent/60">{formatDate(shipment.created_at)}</Td>
                <Td className="text-accent/60">
                  {shipment.ship_city}, {shipment.ship_country}
                </Td>
                <Td>
                  <StatusBadge status={shipment.status} />
                </Td>
                <Td className="text-right text-accent/60">{shipment.item_count}</Td>
                <Td className="text-right font-medium">
                  {formatMoney(shipment.seller_payout_amount_minor, shipment.currency)}
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
            href={`/seller/orders?${new URLSearchParams({
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
