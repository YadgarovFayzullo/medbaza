import Link from 'next/link';
import { Package } from 'lucide-react';

import { PageHeader } from '@/components/domain/section';
import { StatusBadge } from '@/components/domain/status-badge';
import { ButtonLink, Card, EmptyState, TableWrap, Td, Th } from '@/components/ui';
import { requireSession } from '@/lib/auth/guards';
import { orders } from '@/lib/api-client/endpoints';
import { formatDate, formatMoney } from '@/lib/utils/money';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Buyurtmalar' };

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams: { cursor?: string };
}) {
  const session = await requireSession('/account');
  const page = await orders.list(session.accessToken, searchParams.cursor);

  if (page.items.length === 0) {
    return (
      <div>
        <PageHeader title="Buyurtmalarim" />
        <EmptyState
          icon={Package}
          title="Hozircha buyurtma yo’q"
          description="Buyurtma bergach, u shu yerda ko’rinadi — har bir sotuvchi jo’natmasi alohida kuzatiladi."
          action={<ButtonLink href="/search">Katalogni ko’rish</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Buyurtmalarim"
        description="Har bir buyurtma — bitta qator; sotuvchilar alohida jo’natadi va kuzatiladi."
      />

      <TableWrap>
        <thead>
          <tr>
            <Th>Buyurtma</Th>
            <Th>Sana</Th>
            <Th>Holat</Th>
            <Th>Sotuvchilar</Th>
            <Th>Mahsulot</Th>
            <Th className="text-right">Jami</Th>
          </tr>
        </thead>
        <tbody>
          {page.items.map((order) => (
            <tr key={order.id}>
              <Td>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="font-medium text-primary-ink hover:underline"
                >
                  {order.number}
                </Link>
              </Td>
              <Td className="text-accent/60">{formatDate(order.created_at)}</Td>
              <Td>
                <StatusBadge status={order.status} />
              </Td>
              <Td className="text-accent/60">{order.seller_count}</Td>
              <Td className="text-accent/60">{order.item_count}</Td>
              <Td className="text-right font-medium">
                {formatMoney(order.total_amount_minor, order.currency)}
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      {page.next_cursor ? (
        <div className="flex justify-center pt-6">
          <ButtonLink href={`/account?cursor=${page.next_cursor}`} variant="secondary">
            Eski buyurtmalar
          </ButtonLink>
        </div>
      ) : null}

      <Card className="mt-6 p-5 text-sm text-accent/60">
        Biror narsani qaytarmoqchimisiz? Buyurtmani oching va jo’natmani tanlang — qaytarish
        sotuvchi bo’yicha ochiladi.
      </Card>
    </div>
  );
}
