'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Heart, Home, LayoutGrid, ShoppingCart, User as UserIcon, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useSession } from '@/features/auth/session-provider';
import { useCart } from '@/features/cart/cart-provider';
import { useSaved } from '@/features/saved/saved-provider';
import type { CategoryTree } from '@/lib/api-client/endpoints';
import { cn } from '@/lib/utils/cn';

const ROLE_HOME: Record<string, string> = {
  seller: '/seller',
  admin: '/admin',
};

/**
 * The footer is hidden on a phone, so the links that lived only there are
 * carried here instead. §9 does not allow a viewport to hide a destination.
 */
const SECONDARY = [
  { label: 'Buyurtmani kuzatish', href: '/orders/track' },
  { label: 'MedBaza’da sotish', href: '/sell' },
  { label: 'Qaytarish siyosati', href: '/returns' },
  { label: 'Tartibga solish ma’lumotlari', href: '/compliance' },
];

/**
 * The storefront's navigation on a phone.
 *
 * The header cannot hold the catalog, the account, the basket and saved items
 * on a 360px line, so on small screens they move down here where a thumb
 * reaches them. Above `sm` this is hidden and the header carries them as
 * before — one set of destinations, two placements, never both at once.
 */
export function MobileTabBar({ categories }: { categories: CategoryTree[] }) {
  const pathname = usePathname() ?? '/';
  const { user, ready } = useSession();
  const { itemCount } = useCart();
  const { slugs } = useSaved();
  const [catalogOpen, setCatalogOpen] = useState(false);

  // A tap that navigates should leave the sheet closed behind it.
  useEffect(() => setCatalogOpen(false), [pathname]);

  // Locking the page behind the sheet stops the list scrolling the page under it.
  useEffect(() => {
    if (!catalogOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [catalogOpen]);

  const account = !ready ? '/login' : user ? (ROLE_HOME[user.role] ?? '/account') : '/login';

  return (
    <>
      {catalogOpen ? (
        <CatalogSheet categories={categories} onClose={() => setCatalogOpen(false)} />
      ) : null}

      <nav
        aria-label="Asosiy navigatsiya"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-accent/10 bg-white sm:hidden"
      >
        <ul className="grid grid-cols-5">
          <Tab href="/" icon={Home} label="Bosh sahifa" active={pathname === '/'} />
          <Tab
            icon={catalogOpen ? X : LayoutGrid}
            label="Katalog"
            active={catalogOpen}
            onClick={() => setCatalogOpen((open) => !open)}
            expanded={catalogOpen}
          />
          <Tab
            href="/cart"
            icon={ShoppingCart}
            label="Savat"
            active={pathname.startsWith('/cart')}
            count={itemCount}
          />
          <Tab
            href="/saved"
            icon={Heart}
            label="Saralangan"
            active={pathname.startsWith('/saved')}
            count={slugs.length}
          />
          <Tab
            href={account}
            icon={UserIcon}
            label={user ? 'Kabinet' : 'Kirish'}
            active={
              pathname.startsWith('/account') ||
              pathname.startsWith('/seller') ||
              pathname.startsWith('/admin') ||
              pathname.startsWith('/login')
            }
          />
        </ul>
      </nav>
    </>
  );
}

function Tab({
  href,
  icon: Icon,
  label,
  active,
  count = 0,
  onClick,
  expanded,
}: {
  href?: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  count?: number;
  onClick?: () => void;
  expanded?: boolean;
}) {
  const body = (
    <>
      <span className="relative">
        <Icon className="h-5 w-5" aria-hidden />
        {count > 0 ? (
          <span className="absolute -right-2 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-ink px-1 text-[10px] font-semibold text-white">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </span>
      <span className="text-[11px] leading-none">{label}</span>
    </>
  );

  const className = cn(
    'flex h-14 w-full flex-col items-center justify-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-ink',
    active ? 'font-medium text-primary-ink' : 'text-accent/60',
  );

  return (
    <li>
      {href ? (
        <Link href={href} aria-current={active ? 'page' : undefined} className={className}>
          {body}
        </Link>
      ) : (
        <button type="button" onClick={onClick} aria-expanded={expanded} className={className}>
          {body}
        </button>
      )}
    </li>
  );
}

/** Full-height list of departments, because a dropdown anchored to a bottom bar
 *  would open into the keyboard's half of the screen. */
function CatalogSheet({
  categories,
  onClose,
}: {
  categories: CategoryTree[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bottom-14 z-40 overflow-y-auto bg-white sm:hidden">
      <div className="flex items-center justify-between border-b border-accent/10 px-4 py-3">
        <h2 className="text-sm font-semibold">Katalog</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Yopish"
          className="rounded-lg p-1.5 text-accent/60 hover:bg-base focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-ink"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <ul className="divide-y divide-accent/10 pb-4">
        {categories.map((department) => (
          <li key={department.id} className="px-4 py-3">
            <Link
              href={`/category/${department.slug}`}
              className="flex items-center justify-between text-sm font-medium"
            >
              {department.name}
              <span className="text-xs font-normal text-accent/40">{department.product_count}</span>
            </Link>
            {department.children.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {department.children.map((child) => (
                  <li key={child.id}>
                    <Link href={`/category/${child.slug}`} className="block text-sm text-accent/70">
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>

      <ul className="border-t border-accent/10 px-4 py-3 pb-6">
        {SECONDARY.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="block py-2 text-sm text-accent/70">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
