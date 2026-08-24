import Link from 'next/link';
import { Package } from 'lucide-react';

import { PageHeader } from '@/components/domain/section';
import { StatusBadge } from '@/components/domain/status-badge';
import { ButtonLink, EmptyState, TableWrap, Td, Th } from '@/components/ui';
import { admin } from '@/lib/api-client/endpoints';
import { requireRole } from '@/lib/auth/guards';
import { formatDate, formatMoney } from '@/lib/utils/money';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Buyurtmalar' };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; cursor?: string };
}) {
  const session = await requireRole('admin', '/admin/orders');
  const page = await admin.orders(session.accessToken, {
    status: searchParams.status,
    cursor: searchParams.cursor,
  });

  return (
    <div>
      <PageHeader
        title="Buyurtmalar"
        description="Barcha buyurtmalar; holat jo’natmalardan hisoblanadi."
      />

      {page.items.length === 0 ? (
        <EmptyState icon={Package} title="Hozircha buyurtma yo’q" />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Buyurtma</Th>
              <Th>Sana</Th>
              <Th>Holat</Th>
              <Th>Sotuvchilar</Th>
              <Th>Retsept</Th>
              <Th className="text-right">Jami</Th>
            </tr>
          </thead>
          <tbody>
            {page.items.map((order) => (
              <tr key={order.id}>
                <Td>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-primary-ink hover:underline"
                  >
                    {order.number}
                  </Link>
                  <span className="block font-mono text-xs text-accent/40">
                    {order.buyer_id ? order.buyer_id.slice(0, 8) : 'mehmon'}
                  </span>
                </Td>
                <Td className="text-accent/60">{formatDate(order.created_at)}</Td>
                <Td>
                  <StatusBadge status={order.status} />
                </Td>
                <Td className="text-accent/60">{order.seller_count}</Td>
                <Td className="text-accent/60">{order.prescription_required ? 'Ha' : '—'}</Td>
                <Td className="text-right font-medium">
                  {formatMoney(order.total_amount_minor, order.currency)}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {page.next_cursor ? (
        <div className="flex justify-center pt-6">
          <ButtonLink variant="secondary" href={`/admin/orders?cursor=${page.next_cursor}`}>
            Yana ko’rsatish
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
