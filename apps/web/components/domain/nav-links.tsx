'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  label: string;
  href: string;
  /**
   * A rendered icon, not an icon component: a Server Component layout owns
   * these lists, and a function cannot cross the boundary into this client
   * leaf. An element can.
   */
  icon: React.ReactNode;
}

/**
 * The active-nav marking for a dashboard rail.
 *
 * This is a Client Component on purpose, and it is the only client leaf in the
 * shell: a layout is not re-rendered when the router moves between its child
 * pages, so a path read on the server during the first render sticks and the
 * highlight trails a navigation behind. `usePathname` re-renders on every
 * navigation, which is the whole requirement. Everything around it — the
 * header, the account menu, the page itself — stays a Server Component.
 */
export function NavLinks({ nav, label }: { nav: NavItem[]; label: string }) {
  const pathname = usePathname() ?? '';

  // Every rail opens with an index item ('/seller', '/account', '/admin') whose
  // href prefixes each of its siblings, so a plain prefix test marks two rows at
  // once on any nested page. Only the most specific match may win.
  const activeHref = nav
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav aria-label={label} className="lg:w-56 lg:shrink-0">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {nav.map((item) => {
          const active = item.href === activeHref;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm ${
                  active
                    ? 'bg-primary/10 font-medium text-primary-ink'
                    : 'text-accent/70 hover:bg-base hover:text-accent'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
