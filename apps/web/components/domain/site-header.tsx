import Link from 'next/link';
import { Activity } from 'lucide-react';

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
      {/*
        One row on a wide screen; on a phone the search bar wraps onto its own
        line so it keeps a usable width, while the logo, the catalog button and
        the account icons share the line above it. Flex `order` does the
        rearranging, so each control is rendered once rather than twice for two
        breakpoints.
      */}
      <div className="mx-auto flex w-full max-w-content flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
        <Link
          href="/"
          className="order-1 flex shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-ink text-white">
            <Activity className="h-4 w-4" aria-hidden />
          </span>
          <span className="hidden text-lg sm:inline">MedBaza</span>
        </Link>

        {/* Hidden on a phone because the tab bar carries it there. Every
            destination stays reachable at every width (§9) — just from a
            different place. */}
        <div className="order-2 hidden shrink-0 sm:block">
          <CatalogMenu categories={categories} />
        </div>

        <nav
          aria-label="Hisob, saralanganlar va savat"
          className="order-3 ml-auto hidden shrink-0 items-center gap-1 sm:order-4 sm:ml-0 sm:flex"
        >
          <SavedLink />
          <CartLink />
          <AccountMenu />
        </nav>

        <div className="order-4 w-full min-w-0 sm:order-3 sm:w-auto sm:flex-1">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
