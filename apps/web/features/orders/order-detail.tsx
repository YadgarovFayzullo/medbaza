import Link from 'next/link';
import { Package, Truck } from 'lucide-react';

import { Price } from '@/components/domain/price';
import { StatusBadge, statusLabel } from '@/components/domain/status-badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import type { Order } from '@/lib/api-client/endpoints';
import { formatDateTime, formatMoney } from '@/lib/utils/money';

/**
 * Xaridor uchun buyurtma ko‘rinishi.
 *
 * Bu yerdagi hamma narsa xarid vaqtidagi nusxa: eski buyurtma o‘sha paytdagi nom
 * va narxni saqlaydi (CLAUDE.md §5.2).
 */
export function OrderDetail({ order, actions }: { order: Order; actions?: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="space-y-1">
            <CardTitle>Buyurtma {order.number}</CardTitle>
            <p className="text-sm text-accent/60">{formatDateTime(order.created_at)} da berilgan</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={order.status} />
            <Price amountMinor={order.total_amount_minor} currency={order.currency} />
          </div>
        </CardHeader>
        <CardBody className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1 text-sm">
            <p className="text-accent/50">Yetkazish manzili</p>
            <p className="font-medium">
              {order.shipping_address.recipient_name}
              <br />
              {order.shipping_address.line1}
              {order.shipping_address.line2 ? (
                <>
                  <br />
                  {order.shipping_address.line2}
                </>
              ) : null}
              <br />
              {order.shipping_address.city}
              {order.shipping_address.region ? `, ${order.shipping_address.region}` : ''}{' '}
              {order.shipping_address.postal_code}
              <br />
              {order.shipping_address.country}
            </p>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-accent/60">Mahsulotlar</dt>
              <dd>{formatMoney(order.items_amount_minor, order.currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-accent/60">Yetkazib berish</dt>
              <dd>
                {order.shipping_amount_minor === 0
                  ? 'Bepul'
                  : formatMoney(order.shipping_amount_minor, order.currency)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-accent/10 pt-2 font-semibold">
              <dt>Jami</dt>
              <dd>{formatMoney(order.total_amount_minor, order.currency)}</dd>
            </div>
            {order.prescription_required ? (
              <div className="flex justify-between pt-1">
                <dt className="text-accent/60">Retsept</dt>
                <dd>
                  <StatusBadge status={order.prescription_status ?? 'pending_review'} />
                </dd>
              </div>
            ) : null}
          </dl>
        </CardBody>
        {actions ? (
          <div className="flex flex-wrap gap-3 border-t border-accent/10 p-5">{actions}</div>
        ) : null}
      </Card>

      {/* Qisman bajarilish odatiy holat: har bir sotuvchi jo‘natmasi mustaqil harakatlanadi. */}
      {order.shipments.map((shipment) => (
        <Card key={shipment.id}>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle className="text-base">{shipment.seller_name}</CardTitle>
              {shipment.tracking_number ? (
                <p className="flex items-center gap-1.5 text-sm text-accent/60">
                  <Truck className="h-3.5 w-3.5" aria-hidden />
                  {shipment.carrier ? `${shipment.carrier} · ` : ''}
                  {shipment.tracking_number}
                </p>
              ) : null}
            </div>
            <StatusBadge status={shipment.status} />
          </CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-accent/10">
              {shipment.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-4 p-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-accent/10 bg-base">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-4 w-4 text-accent/20" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-40 flex-1">
                    <Link
                      href={`/product/${item.product_slug}`}
                      className="text-sm font-medium hover:text-primary-ink"
                    >
                      {item.product_name}
                    </Link>
                    <p className="text-xs text-accent/50">
                      {item.quantity} × {formatMoney(item.unit_amount_minor, item.currency)} · SKU{' '}
                      {item.sku}
                    </p>
                  </div>
                  <Price amountMinor={item.line_amount_minor} currency={item.currency} size="sm" />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ))}

      {order.events.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Buyurtma tarixi</CardTitle>
          </CardHeader>
          <CardBody>
            <ol className="space-y-3">
              {order.events.map((event) => (
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
  );
}
