import { FileCheck2, Lock, ScrollText, ShieldCheck } from 'lucide-react';

import { PageHeader } from '@/components/domain/section';
import { Card } from '@/components/ui';

export const metadata = { title: 'Tartibga solish ma’lumotlari' };

const SECTIONS = [
  {
    icon: ShieldCheck,
    title: 'Sotuvchini tekshirish',
    body: 'Har bir sotuvchi hisobi tasdiqlanishidan oldin biznes litsenziyasi, soliq ro’yxati va turkum sertifikatlarini topshiradi. Admin tasdiqlamaguncha e’lonlar efirga chiqmaydi; to’xtatilgan sotuvchining e’lonlari do’kondan darhol olib tashlanadi.',
  },
  {
    icon: FileCheck2,
    title: 'Mahsulot sertifikati',
    body: 'Diagnostika, tibbiy uskunalar, dori vositalari va harakatlanish vositalari qayd etilgan CE, FDA yoki ISO sertifikatisiz chop etilmaydi. E’londa ko’rsatilgan belgi — sotuvchi o’sha mahsulot uchun ro’yxatdan o’tkazgan belgi; katalogni shu bo’yicha filtrlashingiz mumkin.',
  },
  {
    icon: ScrollText,
    title: 'Retsept bo’yicha mahsulotlar',
    body: '«Retsept talab qilinadi» deb belgilangan mahsulotlar siz yuklagan retseptni litsenziyalangan mutaxassis tasdiqlamaguncha jo’natilmaydi. Rad etish sabab bilan bo’ladi. Sotuvchiga faqat talab bajarilgani aytiladi.',
  },
  {
    icon: Lock,
    title: 'Hujjatlaringiz qanday saqlanadi',
    body: 'Retseptlar yopiq omborda shifrlangan holda saqlanadi va faqat bir necha daqiqada muddati tugaydigan bir martalik havolalar orqali ochiladi. Har bir ko’rish audit jurnaliga yoziladi. Sotuvchi hujjatni olmaydi; sog’liq ma’lumotlari loglarda yoki xatlarda saqlanmaydi.',
  },
];

export default function CompliancePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Tartibga solish ma’lumotlari"
        description="Nimani tekshiramiz, nimani saqlaymiz va kim ko’ra oladi."
      />
      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <Card key={section.title} className="p-6">
            <p className="flex items-center gap-2 text-base font-semibold">
              <section.icon className="h-4 w-4 text-primary-ink" aria-hidden />
              {section.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-accent/70">{section.body}</p>
          </Card>
        ))}
      </div>
      <p className="mt-8 text-xs text-accent/50">
        MedBaza — bozor maydoni, tibbiyot muassasasi emas; bu yerdagi hech narsa tibbiy maslahat
        emas. Sizga nima to’g’ri kelishini shifokor bilan maslahatlashing.
      </p>
    </div>
  );
}
