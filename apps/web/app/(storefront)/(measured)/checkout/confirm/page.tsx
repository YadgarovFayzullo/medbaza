import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

import { ButtonLink, Card } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Buyurtma qabul qilindi' };

export default function ConfirmPage({
  searchParams,
}: {
  searchParams: { order?: string; number?: string };
}) {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <Card className="space-y-5 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary-ink" aria-hidden />
        <h1 className="text-2xl">Buyurtma qabul qilindi</h1>
        {searchParams.number ? (
          <p className="text-sm text-accent/70">
            Buyurtma raqamingiz{' '}
            <span className="font-semibold text-accent">{searchParams.number}</span>. Saqlab qo’ying
            — hisobga kirmasdan buyurtmani shu raqam orqali kuzatasiz.
          </p>
        ) : null}
        <p className="text-sm text-accent/60">
          Buyurtmadagi har bir sotuvchi alohida jo’natadi va har bir jo’natma alohida kuzatiladi.
          To’lov o’tishi bilan sizga xat yuboriladi.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {searchParams.order ? (
            <ButtonLink href={`/account/orders/${searchParams.order}`}>
              Buyurtmani ko’rish
            </ButtonLink>
          ) : null}
          <ButtonLink href="/search" variant="secondary">
            Xaridni davom ettirish
          </ButtonLink>
        </div>
        <p className="pt-2 text-xs text-accent/50">
          Mehmon sifatida rasmiylashtirdingizmi?{' '}
          <Link href="/orders/track" className="text-primary-ink hover:underline">
            Buyurtmani kuzating
          </Link>{' '}
          — yuqoridagi raqam va pochtangiz bilan.
        </p>
      </Card>
    </div>
  );
}
