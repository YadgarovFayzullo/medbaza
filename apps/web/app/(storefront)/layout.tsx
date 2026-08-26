import { SiteFooter } from '@/components/domain/site-footer';
import { SiteHeader } from '@/components/domain/site-header';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      {/* No width cap here — `(measured)/layout.tsx` applies it to the routes
          that want it, leaving the product page free to run edge to edge. */}
      <main id="main" className="w-full flex-1 py-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
