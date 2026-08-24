import Link from 'next/link';
import { notFound } from 'next/navigation';

import { statusLabel } from '@/components/domain/status-badge';
import { Alert, Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { AdminShipmentActions } from '@/features/orders/admin-shipment-actions';
import { OrderDetail } from '@/features/orders/order-detail';
import { ApiError } from '@/lib/api-client';
import { admin } from '@/lib/api-client/endpoints';
import { requireRole } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export default async function AdminOrderPage({ params }: { params: { id: string } }) {
  const session = await requireRole('admin', `/admin/orders/${params.id}`);

  const order = await admin.order(session.accessToken, params.id).catch((error) => {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="text-sm text-primary-ink hover:underline">
        ← Barcha buyurtmalar
      </Link>

      <Alert tone="warning" title="Admin aralashuvi">
        Bu yerda jo’natmani o’zgartirish sotuvchini chetlab o’tadi. Har bir o’zgarish sizning
        ID’ingiz va siz ko’rsatgan sabab bilan audit jurnaliga yoziladi.
      </Alert>

      <OrderDetail order={order} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jo’natma holatini majburan o’zgartirish</CardTitle>
        </CardHeader>
        <CardBody className="space-y-6">
          {order.shipments.map((shipment) => (
            <div
              key={shipment.id}
              className="space-y-2 border-b border-accent/10 pb-6 last:border-0 last:pb-0"
            >
              <p className="text-sm font-medium">
                {shipment.seller_name}{' '}
                <span className="font-normal text-accent/50">
                  — hozir: {statusLabel(shipment.status)}
                </span>
              </p>
              <AdminShipmentActions shipment={shipment} />
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
