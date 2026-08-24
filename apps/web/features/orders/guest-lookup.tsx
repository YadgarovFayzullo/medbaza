'use client';

import { useState } from 'react';

import { OrderDetail } from '@/features/orders/order-detail';
import { Alert, Button, Card, Input } from '@/components/ui';
import { ApiError, request } from '@/lib/api-client';
import type { Order } from '@/lib/api-client/endpoints';

export function GuestOrderLookup() {
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setOrder(
        await request<Order>('/orders/lookup', {
          query: { number: number.trim(), email: email.trim() },
          cache: 'no-store',
        }),
      );
    } catch (caught) {
      setOrder(null);
      setError(caught instanceof ApiError ? caught.message : 'Hozircha buyurtmani topib bo’lmadi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          {error ? (
            <Alert tone="warning" title="Topilmadi">
              {error}
            </Alert>
          ) : null}
          <Input
            label="Buyurtma raqami"
            required
            placeholder="MB-202608-A1B2C3"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
          />
          <Input
            label="Elektron pochta"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="submit" loading={loading}>
            Buyurtmani topish
          </Button>
        </form>
      </Card>

      {order ? <OrderDetail order={order} /> : null}
    </div>
  );
}
