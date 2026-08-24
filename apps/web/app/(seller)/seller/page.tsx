import Link from 'next/link';
import { AlertTriangle, Truck } from 'lucide-react';

import { StatTile } from '@/components/domain/dashboard-shell';
import { PageHeader } from '@/components/domain/section';
import { StatusBadge } from '@/components/domain/status-badge';
import {
  Alert,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
} from '@/components/ui';
import { ApiError } from '@/lib/api-client';
import { seller } from '@/lib/api-client/endpoints';
import { requireSession } from '@/lib/auth/guards';
import { formatDate, formatMoney, formatMoneyCompact } from '@/lib/utils/money';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Sotuvchi paneli' };

export default async function SellerDashboard() {
  const session = await requireSession('/seller');

  const account = await seller.me(session.accessToken).catch((error) => {
    if (error instanceof ApiError && error.status === 403) return null;
    throw error;
  });

  if (!account) {
    return (
      <div>
        <PageHeader title="Sotuvchi kabineti" />
        <EmptyState
          icon={AlertTriangle}
          title="Sotuvchi profili yo’q"
          description="Ariza qoldiring — muvofiqlik guruhi litsenziya va sertifikatlaringizni tekshiradi."
          action={<ButtonLink href="/sell">Ariza qoldirish</ButtonLink>}
        />
      </div>
    );
  }

  const [stats, shipments] = await Promise.all([
    seller.stats(session.accessToken),
    seller
      .shipments(session.accessToken, { status: 'paid' })
      .catch(() => ({ items: [], next_cursor: null })),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={account.business_name}
        description="E’lonlaringiz, qoldiq va bajarish navbati."
        actions={<ButtonLink href="/seller/listings/new">Yangi e’lon</ButtonLink>}
      />

      {account.status !== 'verified' ? (
        <Alert tone="warning" title="Hisob tasdiqlanmagan">
          {account.rejection_reason ??
            'Hisobingiz tasdiqlanishini kutmoqda. Tasdiqlanmaguncha e’lonlar qoralama bo’lib turadi.'}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Efirdagi e’lonlar"
          value={stats.active_listings}
          hint={`${stats.draft_listings} ta qoralama`}
        />
        <StatTile
          label="E’tibor talab qiladi"
          value={stats.out_of_stock + stats.low_stock}
          hint={`${stats.out_of_stock} ta tugagan, ${stats.low_stock} ta kam qoldi`}
        />
        <StatTile
          label="Bajarish kerak"
          value={stats.open_shipments}
          hint={`30 kunda ${stats.shipped_last_30d} ta jo’natildi`}
        />
        <StatTile
          label="Daromad (30 kun)"
          value={formatMoneyCompact(stats.revenue_last_30d_minor, stats.currency)}
          hint={`${formatMoney(stats.pending_payout_minor, stats.currency)} to’lov kutilmoqda`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tayyorlash kutilmoqda</CardTitle>
          <Link
            href="/seller/orders"
            className="text-sm font-medium text-primary-ink hover:underline"
          >
            Barcha buyurtmalar →
          </Link>
        </CardHeader>
        <CardBody className="p-0">
          {shipments.items.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Truck}
                title="Navbat bo’sh"
                description="To’langan buyurtmalar shu yerda ko’rinadi."
              />
            </div>
          ) : (
            <ul className="divide-y divide-accent/10">
              {shipments.items.slice(0, 6).map((shipment) => (
                <li key={shipment.id} className="flex flex-wrap items-center gap-4 p-4">
                  <Link
                    href={`/seller/orders/${shipment.id}`}
                    className="text-sm font-medium text-primary-ink hover:underline"
                  >
                    {shipment.order_number}
                  </Link>
                  <span className="text-sm text-accent/60">
                    {shipment.item_count} ta mahsulot · {shipment.ship_city},{' '}
                    {shipment.ship_country}
                  </span>
                  <span className="ml-auto text-sm text-accent/60">
                    {formatDate(shipment.created_at)}
                  </span>
                  <StatusBadge status={shipment.status} />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Alert tone="info" title="To’lovlar">
        Ko’p sotuvchili buyurtmalar jo’natma bo’yicha bo’linadi. To’lov jadvali hali tanlanmagan
        to’lov provayderiga bog’liq — joriy holatni to’lovlar sahifasida ko’ring.
      </Alert>
    </div>
  );
}
