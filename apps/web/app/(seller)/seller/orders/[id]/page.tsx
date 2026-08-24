import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Package } from 'lucide-react';

import { Price } from '@/components/domain/price';
import { PageHeader } from '@/components/domain/section';
import { StatusBadge, statusLabel } from '@/components/domain/status-badge';
import { Alert, Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { FulfilmentActions } from '@/features/sellers/fulfilment-actions';
import { ApiError } from '@/lib/api-client';
import { seller } from '@/lib/api-client/endpoints';
import { requireSession } from '@/lib/auth/guards';
import { formatDateTime, formatMoney } from '@/lib/utils/money';

export const dynamic = 'force-dynamic';

export default async function SellerShipmentPage({ params }: { params: { id: string } }) {
  const session = await requireSession(`/seller/orders/${params.id}`);

  const shipment = await seller.shipment(session.accessToken, params.id).catch((error) => {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });
  if (!shipment) notFound();

  const hasPrescriptionItem = shipment.items.some((item) => item.prescription_required);

  return (
    <div className="space-y-6">
      <Link href="/seller/orders" className="text-sm text-primary-ink hover:underline">
        ← Barcha buyurtmalar
      </Link>

      <PageHeader
        title={`Order ${shipment.order_number}`}
        description={`${formatDateTime(shipment.created_at)} da berilgan`}
        actions={<StatusBadge status={shipment.status} />}
      />

      {hasPrescriptionItem ? (
        <Alert tone="info" title="Retsept bilan cheklangan">
          Retsept tasdiqlanmaguncha bu jo’natma <em>to’langan</em> holatidan chiqa olmaydi. Sizga
          faqat talab bajarilgani aytiladi — hujjatning o’zi emas.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Qadoqlash uchun mahsulotlar</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <ul className="divide-y divide-accent/10">
                {shipment.items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-4 p-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-accent/10 bg-base">
                      <Package className="h-4 w-4 text-accent/25" aria-hidden />
                    </span>
                    <div className="min-w-40 flex-1">
                      <p className="text-sm font-medium">{item.product_name}</p>
                      <p className="text-xs text-accent/50">SKU {item.sku}</p>
                    </div>
                    <span className="text-sm text-accent/60">× {item.quantity}</span>
                    <Price
                      amountMinor={item.line_amount_minor}
                      currency={item.currency}
                      size="sm"
                    />
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Holatni yangilash</CardTitle>
            </CardHeader>
            <CardBody>
              <FulfilmentActions shipment={shipment} />
            </CardBody>
          </Card>

          {shipment.events.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tarix</CardTitle>
              </CardHeader>
              <CardBody>
                <ol className="space-y-3">
                  {shipment.events.map((event) => (
                    <li key={event.id} className="flex gap-3 text-sm">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-ink"
                        aria-hidden
                      />
                      <div>
                        <p className="font-medium">
                          {event.from_status
                            ? `${statusLabel(event.from_status)} → ${statusLabel(event.to_status)}`
                            : statusLabel(event.to_status)}
                        </p>
                        <p className="text-xs text-accent/50">
                          {formatDateTime(event.created_at)}
                          {event.reason ? ` · ${event.reason}` : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-accent/60">
              Yetkazish manzili
            </h2>
            <p className="mt-3 text-sm">
              {shipment.recipient_name}
              <br />
              {shipment.ship_line1}
              {shipment.ship_line2 ? (
                <>
                  <br />
                  {shipment.ship_line2}
                </>
              ) : null}
              <br />
              {shipment.ship_city}
              {shipment.ship_region ? `, ${shipment.ship_region}` : ''} {shipment.ship_postal_code}
              <br />
              {shipment.ship_country}
            </p>
            <p className="mt-3 text-xs text-accent/50">
              Bu yetkazish uchun yetarli. Xaridorning aloqa ma’lumotlari MedBaza’da qoladi.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-accent/60">To’lov</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-accent/60">Mahsulotlar</dt>
                <dd>{formatMoney(shipment.items_amount_minor, shipment.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-accent/60">Yetkazib berish</dt>
                <dd>{formatMoney(shipment.shipping_amount_minor, shipment.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-accent/60">Platforma komissiyasi</dt>
                <dd>−{formatMoney(shipment.platform_fee_amount_minor, shipment.currency)}</dd>
              </div>
              <div className="flex justify-between border-t border-accent/10 pt-2 font-semibold">
                <dt>Sizning to’lovingiz</dt>
                <dd>{formatMoney(shipment.seller_payout_amount_minor, shipment.currency)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
