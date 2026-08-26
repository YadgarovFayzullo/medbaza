import { BadgeCheck, LineChart, Package, Wallet } from 'lucide-react';

import { PageHeader } from '@/components/domain/section';
import { ButtonLink, Card } from '@/components/ui';
import { SellerApplicationForm } from '@/features/sellers/application-form';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'MedBaza’da sotish' };

const BENEFITS = [
  {
    icon: Package,
    title: 'O’z katalogingiz bilan keling',
    body: 'E’lonlarni SKU, sertifikat va qoldiq bilan yuklang, omborni bitta ekrandan yuriting.',
  },
  {
    icon: BadgeCheck,
    title: 'Tasdiqlangan sotuvchi belgisi',
    body: 'Litsenziya va sertifikatlar tasdiqlangach, belgi har bir e’loningizda ko’rinadi.',
  },
  {
    icon: LineChart,
    title: 'Bajarish nazorati sizda',
    body: 'Siz faqat o’z jo’natmangizni va unga kerakli manzilni ko’rasiz, boshqa hech narsani emas.',
  },
  {
    icon: Wallet,
    title: 'Har bir sotuvchiga alohida to’lov',
    body: 'Ko’p sotuvchili buyurtma avtomatik bo’linadi; to’lovingiz jo’natma bo’yicha hisoblanadi.',
  },
];

export default async function SellPage() {
  const session = await getSession().catch(() => null);

  return (
    <div className="space-y-10">
      <PageHeader
        title="MedBaza’da sotish"
        description="Klinikalar, kichik muassasalar va tasdiqlangan yetkazib beruvchi izlayotgan xaridorlarga chiqing."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((benefit) => (
          <Card key={benefit.title} className="p-5">
            <benefit.icon className="h-5 w-5 text-primary-ink" aria-hidden />
            <p className="mt-3 text-sm font-semibold">{benefit.title}</p>
            <p className="mt-1.5 text-sm text-accent/60">{benefit.body}</p>
          </Card>
        ))}
      </div>

      <div className="mx-auto max-w-2xl">
        {session ? (
          <SellerApplicationForm />
        ) : (
          <Card className="space-y-4 p-8 text-center">
            <h2 className="text-lg font-medium">Ariza uchun hisob yarating</h2>
            <p className="text-sm text-accent/60">
              Sotish xarid bilan bir xil hisobdan yuritiladi. Sizdan litsenziya raqami va sertifikat
              hujjatlari so’raladi.
            </p>
            <div className="flex justify-center gap-3">
              <ButtonLink href="/register">Hisob yaratish</ButtonLink>
              <ButtonLink href="/login?next=/sell" variant="secondary">
                Kirish
              </ButtonLink>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
