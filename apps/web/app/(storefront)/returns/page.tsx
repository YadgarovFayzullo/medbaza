import { PageHeader } from '@/components/domain/section';
import { Card } from '@/components/ui';

export const metadata = { title: 'Qaytarish siyosati' };

const STEPS = [
  [
    'Qaytarishni oching',
    'Buyurtmangizdan qaytarmoqchi bo’lgan jo’natmani tanlang va sababni yozing. Qaytarish faqat yetkazilgan jo’natmalarda ochiladi.',
  ],
  [
    'Jo’nating',
    'Sotuvchi qaytarish manzilini tasdiqlaydi. Mahsulot ochilmagan, asl qadoqda va steril plombasi buzilmagan bo’lishi kerak.',
  ],
  [
    'Pulni qaytarish',
    'Sotuvchi qaytarishni qabul qilingan deb belgilagach, pul dastlabki to’lov bo’yicha qaytariladi. Jo’natmaning bir qismi qaytsa, qisman qaytarish ham mumkin.',
  ],
];

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Qaytarish siyosati"
        description="Ochilmagan mahsulotlar uchun 30 kun; buyurtma emas, jo’natma bo’yicha."
      />

      <ol className="space-y-4">
        {STEPS.map(([title, body], index) => (
          <Card as="li" key={title} className="flex gap-4 p-6">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary-ink">
              {index + 1}
            </span>
            <div>
              <p className="text-base font-semibold">{title}</p>
              <p className="mt-1 text-sm text-accent/70">{body}</p>
            </div>
          </Card>
        ))}
      </ol>

      <Card className="mt-6 p-6">
        <p className="text-base font-semibold">Nimalarni qaytarib bo’lmaydi</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-accent/70">
          <li>Ochilgan steril qadoq — bemor xavfsizligi uchun.</li>
          <li>Berib bo’lingan retsept dorilari.</li>
          <li>Qaytarish paytida yaroqlilik muddati o’tgan mahsulotlar.</li>
        </ul>
      </Card>
    </div>
  );
}
