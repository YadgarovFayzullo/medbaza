import { SiteFooter } from '@/components/domain/site-footer';
import { SiteHeader } from '@/components/domain/site-header';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-content flex-1 px-4 py-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
