import { SiteFooter } from '@/components/domain/site-footer';
import { MobileTabBar } from '@/components/domain/mobile-tab-bar';
import { SiteHeader } from '@/components/domain/site-header';
import { catalog } from '@/lib/api-client/endpoints';

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const categories = await catalog.categories().catch(() => []);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      {/* No width cap here — `(measured)/layout.tsx` applies it to the routes
          that want it, leaving the product page free to run edge to edge. */}
      {/* pb clears the fixed tab bar on a phone; it is not there above `sm`. */}
      <main id="main" className="w-full flex-1 py-8 pb-20 sm:pb-8">
        {children}
      </main>
      <SiteFooter />
      <MobileTabBar categories={categories} />
    </div>
  );
}
