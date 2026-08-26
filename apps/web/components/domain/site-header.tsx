import Link from 'next/link';
import { Activity, ShieldCheck } from 'lucide-react';

import { AccountMenu } from '@/components/domain/account-menu';
import { CatalogMenu } from '@/components/domain/catalog-menu';
import { CartLink, SavedLink } from '@/components/domain/saved-link';
import { SearchBar } from '@/components/domain/search-bar';
import { catalog } from '@/lib/api-client/endpoints';

/**
 * A Server Component with five small client leaves: catalog menu, search,
 * category chips, saved/cart counters, and the account menu (CLAUDE.md §3.8).
 */
export async function SiteHeader() {
  const categories = await catalog.categories().catch(() => []);

  return (
    <header className="sticky top-0 z-30 border-b border-accent/10 bg-white">
      {/* Yuqori xizmat paneli */}
      <div className="border-b border-accent/10 bg-base">
        <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-1 px-4 py-1.5 text-xs text-accent/60 lg:px-gutter">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary-ink" aria-hidden />
            Litsenziyasi tekshirilgan sotuvchilar
          </span>
          <Link href="/orders/track" className="hover:text-primary-ink">
            Buyurtmani kuzatish
          </Link>
          <Link href="/returns" className="hover:text-primary-ink">
            Qaytarish
          </Link>
          <div className="ml-auto flex items-center gap-5">
            <Link href="/sell" className="font-medium text-primary-ink hover:underline">
              MedBaza’da soting
            </Link>
            <Link href="/compliance" className="hover:text-primary-ink">
              Tartibga solish ma’lumotlari
            </Link>
          </div>
        </div>
      </div>

      {/* Asosiy panel */}
      <div className="flex w-full items-center gap-3 px-4 py-2.5 lg:px-gutter">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-ink text-white">
            <Activity className="h-4 w-4" aria-hidden />
          </span>
          <span className="hidden text-lg sm:inline">MedBaza</span>
        </Link>

        <div className="hidden sm:block">
          <CatalogMenu categories={categories} />
        </div>

        <div className="min-w-0 flex-1">
          <SearchBar />
        </div>

        <nav
          aria-label="Hisob, saralanganlar va savat"
          className="flex shrink-0 items-center gap-1"
        >
          <SavedLink />
          <CartLink />
          <AccountMenu />
        </nav>
      </div>
    </header>
  );
}
