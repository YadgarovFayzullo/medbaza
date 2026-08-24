'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Layers, Search, Tag } from 'lucide-react';

import { catalog, type SearchSuggestions } from '@/lib/api-client/endpoints';
import { cn } from '@/lib/utils/cn';

const ICONS = { product: Search, category: Layers, brand: Tag } as const;

const TYPE_LABELS = { product: 'mahsulot', category: 'turkum', brand: 'brend' } as const;

/** Turkum va brend bo‘yicha avtoto‘ldirishli qidiruv. */
export function SearchBar({
  className,
  initialQuery = '',
}: {
  className?: string;
  initialQuery?: string;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term.trim()), 180);
    return () => clearTimeout(id);
  }, [term]);

  useEffect(() => {
    function onClickAway(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  const { data } = useQuery<SearchSuggestions>({
    queryKey: ['suggest', debounced],
    queryFn: ({ signal }) => catalog.suggest(debounced, { signal }),
    enabled: debounced.length >= 2,
    staleTime: 60_000,
  });

  const suggestions = useMemo(() => data?.suggestions ?? [], [data]);

  function go(index: number) {
    const suggestion = suggestions[index];
    setOpen(false);
    if (!suggestion) {
      router.push(`/search?q=${encodeURIComponent(term.trim())}`);
      return;
    }
    if (suggestion.type === 'product' && suggestion.slug)
      router.push(`/product/${suggestion.slug}`);
    else if (suggestion.type === 'category' && suggestion.slug)
      router.push(`/category/${suggestion.slug}`);
    else router.push(`/search?q=${encodeURIComponent(suggestion.label)}`);
  }

  return (
    <div ref={container} className={cn('relative w-full', className)}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go(highlighted);
        }}
      >
        <label htmlFor="site-search" className="sr-only">
          Tibbiy mahsulotlarni qidirish
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent/40"
            aria-hidden
          />
          <input
            id="site-search"
            type="search"
            autoComplete="off"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls="search-suggestions"
            value={term}
            placeholder="Mahsulot, brend yoki turkum qidiring"
            onChange={(event) => {
              setTerm(event.target.value);
              setOpen(true);
              setHighlighted(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setHighlighted((index) => Math.min(index + 1, suggestions.length - 1));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setHighlighted((index) => Math.max(index - 1, -1));
              } else if (event.key === 'Escape') {
                setOpen(false);
              }
            }}
            className="w-full rounded-lg border border-accent/15 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-accent/40 focus:border-primary-ink/50 focus:outline-none focus:ring-2 focus:ring-primary-ink/30"
          />
        </div>
      </form>

      {open && suggestions.length > 0 ? (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute z-30 mt-2 w-full animate-fade-in overflow-hidden rounded-lg border border-accent/15 bg-white"
        >
          {suggestions.map((suggestion, index) => {
            const Icon = ICONS[suggestion.type];
            return (
              <li
                key={`${suggestion.type}-${suggestion.label}`}
                role="option"
                aria-selected={index === highlighted}
              >
                <button
                  type="button"
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => go(index)}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm',
                    index === highlighted ? 'bg-base' : 'bg-white',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-accent/40" aria-hidden />
                  <span className="truncate">{suggestion.label}</span>
                  <span className="ml-auto text-xs text-accent/40">
                    {TYPE_LABELS[suggestion.type]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
