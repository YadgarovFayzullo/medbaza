import { Wallet } from 'lucide-react';

import { StatTile } from '@/components/domain/dashboard-shell';
import { PageHeader } from '@/components/domain/section';
import { Alert, Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { seller } from '@/lib/api-client/endpoints';
import { requireSession } from '@/lib/auth/guards';
import { formatMoney } from '@/lib/utils/money';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'To’lovlar' };

export default async function PayoutsPage() {
  const session = await requireSession('/seller/payouts');
  const [status, stats] = await Promise.all([
    seller.payouts(session.accessToken),
    seller.stats(session.accessToken),
  ]);

  return (
    <div>
      <PageHeader title="To’lovlar" description="Qancha ishlaganingiz va to’lovlar tayyorligi." />

      <div className="space-y-6">
        {/* Provayder hali tanlanmagan (CLAUDE.md §4); interfeys buni ochiq aytadi,
            bajarib bo‘lmaydigan jadvalni va’da qilmaydi. */}
        <Alert tone="info" title="To’lov provayderi hali tanlanmagan">
          MedBaza provayderdan mustaqil to’lov chegarasi asosida qurilgan. Provayder tanlanmaguncha
          to’lovlar sinov provayderi (<span className="font-medium">{status.provider}</span>) orqali
          ishlaydi va haqiqiy pul harakatlanmaydi. To’lov jadvali va mablag’ni kim ushlab turishi
          provayder bilan birga hal qilinadi.
        </Alert>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile
            label="Kutilayotgan to’lov"
            value={formatMoney(stats.pending_payout_minor, stats.currency)}
            hint="To’langan, tayyorlanayotgan va jo’natilgan buyurtmalar"
          />
          <StatTile
            label="Ishlab topilgan (30 kun)"
            value={formatMoney(stats.revenue_last_30d_minor, stats.currency)}
            hint="Platforma komissiyasidan keyin"
          />
          <StatTile
            label="To’lovlar"
            value={status.payouts_enabled ? 'Yoqilgan' : 'To’xtatilgan'}
            hint={status.on_hold ? 'Quyida amal talab qilinadi' : 'Ochiq talab yo’q'}
          />
        </div>

        {status.requirements_outstanding.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bajarilmagan talablar</CardTitle>
            </CardHeader>
            <CardBody>
              <ul className="space-y-2 text-sm">
                {status.requirements_outstanding.map((requirement) => (
                  <li key={requirement} className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary-ink" aria-hidden />
                    {requirement.replace(/_/g, ' ')}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : null}

        <Card className="p-5 text-sm text-accent/60">
          Komissiya har bir jo’natmaga alohida qo’llanadi, shuning uchun ko’p sotuvchili buyurtmada
          sizning to’lovingiz boshqa sotuvchiniki bilan aralashmaydi. Qismlar har doim umumiy
          summaga aniq to’g’ri keladi.
        </Card>
      </div>
    </div>
  );
}
