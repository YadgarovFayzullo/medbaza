'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Saved items ("wishlist").
 *
 * Deliberately client-only for now: the API has no wishlist resource, and a
 * saved list is a browsing convenience rather than an account record. Storing
 * product IDs in `localStorage` is fine — the ban in CLAUDE.md §3.8 is on the
 * access token, not on non-sensitive UI state. Nothing here identifies a
 * patient or a purchase.
 */
const STORAGE_KEY = 'medbaza:saved';

interface SavedValue {
  /** Product slugs, most recently saved first. */
  slugs: string[];
  ready: boolean;
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
}

const SavedContext = createContext<SavedValue | null>(null);

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((slug): slug is string => typeof slug === 'string')
      : [];
  } catch {
    return [];
  }
}

export function SavedProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSlugs(read());
    setReady(true);

    // Keep two open tabs in step.
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setSlugs(read());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((next: string[]) => {
    setSlugs(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // A full or blocked store must not break browsing.
    }
  }, []);

  const value = useMemo<SavedValue>(
    () => ({
      slugs,
      ready,
      has: (slug) => slugs.includes(slug),
      toggle: (slug) =>
        persist(slugs.includes(slug) ? slugs.filter((s) => s !== slug) : [slug, ...slugs]),
      remove: (slug) => persist(slugs.filter((s) => s !== slug)),
      clear: () => persist([]),
    }),
    [slugs, ready, persist],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedValue {
  const value = useContext(SavedContext);
  if (!value) throw new Error('useSaved must be used inside <SavedProvider>');
  return value;
}
