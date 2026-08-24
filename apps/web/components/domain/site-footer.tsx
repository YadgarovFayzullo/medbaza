import Link from 'next/link';
import { Activity, Mail, Send } from 'lucide-react';

const COLUMNS = [
  {
    title: 'Biz haqimizda',
    links: [
      { label: 'Kompaniya', href: '/compliance' },
      { label: 'Tartibga solish ma’lumotlari', href: '/compliance' },
      { label: 'Qaytarish siyosati', href: '/returns' },
    ],
  },
  {
    title: 'Xaridorlarga',
    links: [
      { label: 'Buyurtmalarim', href: '/account' },
      { label: 'Retseptlarim', href: '/account/prescriptions' },
      { label: 'Manzillarim', href: '/account/addresses' },
      { label: 'Buyurtmani kuzatish', href: '/orders/track' },
    ],
  },
  {
    title: 'Sotuvchilarga',
    links: [
      { label: 'MedBaza’da sotish', href: '/sell' },
      { label: 'Sotuvchi kabineti', href: '/seller' },
      { label: 'To’lovlar', href: '/seller/payouts' },
    ],
  },
  {
    title: 'Turkumlar',
    links: [
      { label: 'Tibbiy kiyim', href: '/category/medical-wear' },
      { label: 'Bosh kiyimlar', href: '/category/headwear' },
      { label: 'Tibbiy poyabzal', href: '/category/medical-footwear' },
      { label: 'Himoya vositalari', href: '/category/ppe' },
      { label: 'Birinchi yordam', href: '/category/first-aid' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-accent/10 bg-white">
      <div className="mx-auto max-w-content px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-ink text-white">
                <Activity className="h-4 w-4" aria-hidden />
              </span>
              MedBaza
            </Link>
            <p className="text-sm text-accent/60">
              Tibbiy mahsulotlar va uskunalar uchun ko’p sotuvchili bozor: jismoniy shaxslar,
              klinikalar va kichik tibbiyot muassasalari uchun.
            </p>
            <div className="flex gap-2 pt-1">
              <FooterIconLink href="mailto:support@medbaza.example" label="Elektron pochta">
                <Mail className="h-4 w-4" aria-hidden />
              </FooterIconLink>
              <FooterIconLink href="https://t.me/" label="Telegram">
                <Send className="h-4 w-4" aria-hidden />
              </FooterIconLink>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent/50">
                {column.title}
              </p>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-accent/75 hover:text-primary-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-accent/10 pt-6 text-xs text-accent/50">
          <p>
            MedBaza tibbiy maslahat bermaydi. Retsept bo’yicha beriladigan mahsulotlar siz yuklagan
            retsept litsenziyalangan mutaxassis tomonidan tekshirilgandan so’ng jo’natiladi.
          </p>
          <p className="ml-auto">© {new Date().getFullYear()} MedBaza</p>
        </div>
      </div>
    </footer>
  );
}

function FooterIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/15 text-accent/60 hover:border-primary/40 hover:text-primary-ink"
    >
      {children}
    </a>
  );
}
