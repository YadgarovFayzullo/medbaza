import Link from 'next/link';
import { notFound } from 'next/navigation';

import { OrderActions } from '@/features/orders/order-actions';
import { OrderDetail } from '@/features/orders/order-detail';
import { ApiError } from '@/lib/api-client';
import { orders } from '@/lib/api-client/endpoints';
import { requireSession } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }: { params: { id: string } }) {
  const session = await requireSession(`/account/orders/${params.id}`);

  const order = await orders.get(session.accessToken, params.id).catch((error) => {
    // Yo‘q buyurtma va boshqaning buyurtmasi ataylab bir xil ko‘rinadi.
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <Link href="/account" className="text-sm text-primary-ink hover:underline">
        ← Barcha buyurtmalar
      </Link>
      <OrderDetail order={order} actions={<OrderActions order={order} />} />
    </div>
  );
}
