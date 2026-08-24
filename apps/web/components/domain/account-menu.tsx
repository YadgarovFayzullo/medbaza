'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LogOut, Package, User as UserIcon } from 'lucide-react';

import { useSession } from '@/features/auth/session-provider';

const ROLE_HOME: Record<string, { label: string; href: string }> = {
  seller: { label: 'Sotuvchi kabineti', href: '/seller' },
  admin: { label: 'Admin panel', href: '/admin' },
};

export function AccountMenu() {
  const { user, ready, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClickAway(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  if (!ready) return <div className="h-10 w-14 rounded-lg bg-accent/5" aria-hidden />;

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-accent/70 hover:text-primary-ink"
      >
        <UserIcon className="h-5 w-5" aria-hidden />
        Kirish
      </Link>
    );
  }

  const roleHome = ROLE_HOME[user.role];

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-accent/70 hover:text-primary-ink"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary-ink">
          {user.full_name.slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-16 truncate">{user.full_name.split(' ')[0]}</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-56 animate-fade-in overflow-hidden rounded-lg border border-accent/15 bg-white"
        >
          <p className="border-b border-accent/10 px-4 py-3">
            <span className="block truncate text-sm font-medium text-accent">{user.full_name}</span>
            <span className="block truncate text-xs text-accent/50">{user.email}</span>
          </p>
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-base"
          >
            <Package className="h-4 w-4 text-accent/50" aria-hidden />
            Buyurtmalar va hisob
          </Link>
          {roleHome ? (
            <Link
              href={roleHome.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block border-t border-accent/10 px-4 py-3 text-sm hover:bg-base"
            >
              {roleHome.label}
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await signOut();
              router.push('/');
              router.refresh();
            }}
            className="flex w-full items-center gap-2 border-t border-accent/10 px-4 py-3 text-left text-sm hover:bg-base"
          >
            <LogOut className="h-4 w-4 text-accent/50" aria-hidden />
            Chiqish
          </button>
        </div>
      ) : null}
    </div>
  );
}
