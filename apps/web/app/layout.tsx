import type { Metadata, Viewport } from 'next';

import { Providers } from '@/app/providers';
import { pageBackground } from '@/lib/design-tokens';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'MedBaza — tibbiy mahsulotlar va uskunalar',
    template: '%s · MedBaza',
  },
  description:
    'Shaxsiy himoya vositalari, birinchi yordam, diagnostika, harakatlanish vositalari, tibbiy uskunalar va sarf materiallari uchun ko’p sotuvchili bozor.',
};

export const viewport: Viewport = {
  themeColor: pageBackground,
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Sessiya bu yerda ataylab o‘qilmaydi: root layout’da cookie’ga tegish barcha
  // sahifalarni — jumladan ISR do‘kon sahifalarini — dinamik render’ga o‘tkazadi
  // (CLAUDE.md §3.8). Buning o‘rniga `SessionProvider` mount paytida refresh
  // cookie’dan yuklaydi.
  return (
    <html lang="uz">
      <body className="min-h-dvh bg-white">
        <a
          href="#main"
          className="sr-only rounded-lg bg-primary-ink px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
        >
          Asosiy qismga o’tish
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
