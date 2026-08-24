'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LayoutGrid, X } from 'lucide-react';

import type { CategoryTree } from '@/lib/api-client/endpoints';
import { cn } from '@/lib/utils/cn';

/**
 * "Katalog" kirish nuqtasi: chapda bo‘limlar, o‘ngda ularning ichki turkumlari.
 * Daraxt ko‘pi bilan uch qavatli (CLAUDE.md §7), shuning uchun ikki panel yetarli.
 */
export function CatalogMenu({ categories }: { categories: CategoryTree[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickAway(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickAway);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickAway);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const current = categories[active];

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="catalog-menu"
        className={cn(
          'inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors',
          open
            ? 'bg-primary-ink text-white'
            : 'border border-accent/15 bg-white text-accent hover:border-accent/30',
        )}
      >
        {open ? (
          <X className="h-4 w-4" aria-hidden />
        ) : (
          <LayoutGrid className="h-4 w-4" aria-hidden />
        )}
        Katalog
      </button>

      {open ? (
        <div
          id="catalog-menu"
          className="absolute left-0 top-full z-40 mt-2 w-[min(calc(100vw-2rem),720px)] animate-fade-in overflow-hidden rounded-lg border border-accent/15 bg-white"
        >
          <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr]">
            <ul className="border-b border-accent/10 sm:border-b-0 sm:border-r">
              {categories.map((category, index) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug}`}
                    onMouseEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center justify-between gap-2 px-4 py-2.5 text-sm',
                      index === active
                        ? 'bg-base font-medium text-accent'
                        : 'text-accent/75 hover:bg-base',
                    )}
                  >
                    {category.name}
                    <span className="text-xs text-accent/35">{category.product_count}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="p-4">
              {current ? (
                <>
                  <Link
                    href={`/category/${current.slug}`}
                    onClick={() => setOpen(false)}
                    className="text-sm font-semibold text-primary-ink hover:underline"
                  >
                    {current.name}: barchasi →
                  </Link>
                  <ul className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                    {(current.children ?? []).map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/category/${child.slug}`}
                          onClick={() => setOpen(false)}
                          className="block truncate py-1 text-sm text-accent/75 hover:text-primary-ink"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {current.description ? (
                    <p className="mt-4 border-t border-accent/10 pt-3 text-xs text-accent/50">
                      {current.description}
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
