import Link from 'next/link';

import { StatTile } from '@/components/domain/dashboard-shell';
import { PageHeader } from '@/components/domain/section';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { admin } from '@/lib/api-client/endpoints';
import { requireRole } from '@/lib/auth/guards';
import { formatMoney } from '@/lib/utils/money';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Admin paneli' };

export default async function AdminDashboard() {
  const session = await requireRole('admin', '/admin');
  const stats = await admin.stats(session.accessToken);

  const queues = [
    {
      label: 'Tasdiq kutayotgan sotuvchilar',
      count: stats.pending_sellers,
      href: '/admin/sellers?status=pending',
    },
    {
      label: 'Tekshiruv kutayotgan retseptlar',
      count: stats.pending_prescriptions,
      href: '/admin/prescriptions',
    },
    { label: 'Yo’ldagi jo’natmalar', count: stats.open_shipments, href: '/admin/orders' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Umumiy ko’rinish" description="Navbatlar, hajm va qaror kutayotganlar." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Buyurtmalar (7 kun)" value={stats.orders_last_7d} />
        <StatTile
          label="Aylanma (7 kun)"
          value={formatMoney(stats.gmv_last_7d_minor, stats.currency)}
        />
        <StatTile label="Faol e’lonlar" value={stats.active_products} />
        <StatTile
          label="Ochiq navbatlar"
          value={stats.pending_sellers + stats.pending_prescriptions}
          hint="Sotuvchilar va retseptlar"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Qaror kutmoqda</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <ul className="divide-y divide-accent/10">
            {queues.map((queue) => (
              <li key={queue.label}>
                <Link
                  href={queue.href}
                  className="flex items-center justify-between gap-4 px-5 py-4 text-sm hover:bg-base"
                >
                  <span>{queue.label}</span>
                  <span
                    className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold ${
                      queue.count > 0 ? 'bg-primary-ink text-white' : 'bg-base text-accent/50'
                    }`}
                  >
                    {queue.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card className="p-5 text-sm text-accent/60">
        Har bir tasdiqlash qarori, retsept tekshiruvi, pul qaytarish, admin tomonidan buyurtma
        o’zgarishi, rol o’zgarishi va hujjat ko’rilishi audit jurnaliga yoziladi.
      </Card>
    </div>
  );
}
