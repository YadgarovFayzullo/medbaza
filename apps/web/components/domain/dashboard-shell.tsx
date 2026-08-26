import Link from 'next/link';
import { Activity } from 'lucide-react';

import { AccountMenu } from '@/components/domain/account-menu';
import { NavLinks, type NavItem } from '@/components/domain/nav-links';

export type { NavItem };

/**
 * Shared chrome for the three signed-in surfaces: account, seller, admin.
 * A single hairline border separates the rail from the content — no shadows.
 */
export function DashboardShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-accent/10 bg-white">
        <div className="mx-auto flex max-w-content items-center gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-ink text-white">
              <Activity className="h-4 w-4" aria-hidden />
            </span>
            <span className="hidden sm:inline">MedBaza</span>
          </Link>
          <span className="rounded-full border border-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent/70">
            {title}
          </span>
          <div className="ml-auto">
            <AccountMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 px-4 py-6 lg:flex-row">
        <NavLinks nav={nav} label={title} />

        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Flat KPI tile: a border and a background step, nothing more. */
export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-accent/10 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-accent/50">{label}</p>
      <p className="mt-2 text-2xl font-medium">{value}</p>
      {hint ? <p className="mt-1 text-xs text-accent/50">{hint}</p> : null}
    </div>
  );
}
