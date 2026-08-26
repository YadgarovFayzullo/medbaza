import Image from 'next/image';
import Link from 'next/link';
import { Bandage, Footprints, HardHat, Package, ShieldCheck, Shirt } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { HeroCarousel, type Slide } from '@/components/domain/hero-carousel';
import { ProductGrid } from '@/components/domain/product-card';
import { ProductRail } from '@/components/domain/product-rail';
import { ButtonLink } from '@/components/ui';
import { catalog, type ProductPage } from '@/lib/api-client/endpoints';

// Turkum va mahsulot sahifalari ISR bilan ishlaydi (CLAUDE.md §3.8).
export const revalidate = 300;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'medical-wear': Shirt,
  headwear: HardHat,
  'medical-footwear': Footprints,
  ppe: ShieldCheck,
  'first-aid': Bandage,
};

/**
 * Rendered icons, where one exists for the slug. The Lucide map above is the
 * fallback, so a department added to the database always gets a tile — it just
 * gets a line icon until artwork arrives.
 */
const CATEGORY_ART: Record<string, string> = {
  ppe: '/icons/ppe.png',
  'first-aid': '/icons/first-aid.png',
};

// Banners live in `public/`. The copy is inside the artwork, so each slide's
// `alt` repeats it for anyone who cannot see the image.
const SLIDES: Slide[] = [
  {
    id: 'medtexnika',
    src: '/download.png',
    alt: 'Med Texnika: tibbiy asboblarga 60% gacha foyda',
    href: '/search?on_sale=true',
  },
  {
    id: 'shifokorlar',
    src: '/download-2.png',
    alt: 'Yangi shifokorlar kolleksiyasi, TerraPro — 20% chegirma',
    href: '/category/ppe',
  },
];

const EMPTY_PAGE: ProductPage = { items: [], next_cursor: null };

/**
 * Falls back to an empty rail when the catalog cannot be reached.
 *
 * This page is prerendered, so an API that is unreachable at build time would
 * otherwise fail the whole deploy on a rail that is decoration, not content.
 * Every other storefront route already degrades this way, and ISR fills the
 * rails in on the next revalidation. The failure is logged rather than
 * swallowed, so a real outage is still visible (§12.4).
 */
async function orEmpty<T>(work: Promise<T>, fallback: T, rail: string): Promise<T> {
  try {
    return await work;
  } catch (error) {
    console.warn(`homepage: "${rail}" unavailable`, error instanceof Error ? error.message : error);
    return fallback;
  }
}

export default async function HomePage() {
  const [categories, deals, popular, newest] = await Promise.all([
    orEmpty(catalog.categories(), [], 'categories'),
    orEmpty(catalog.products({ on_sale: true, in_stock: true, limit: 12 }), EMPTY_PAGE, 'deals'),
    orEmpty(catalog.products({ sort: 'rating', in_stock: true, limit: 12 }), EMPTY_PAGE, 'popular'),
    orEmpty(catalog.products({ sort: 'newest', limit: 10 }), EMPTY_PAGE, 'newest'),
  ]);

  return (
    <div className="space-y-12">
      <HeroCarousel slides={SLIDES} />

      {/* Tezkor kirish plitkalari — gorizontal: chapda ikonka, o‘ngda nom */}
      {/* Named apart from the header's category chips: two landmarks with the
          same accessible name are indistinguishable to a screen reader. */}
      <section aria-label="Bo‘limlar">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => {
            const art = CATEGORY_ART[category.slug];
            const Icon = CATEGORY_ICONS[category.slug] ?? Package;
            return (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="flex items-center gap-3 rounded-lg bg-base px-4 py-3 transition-colors hover:bg-accent/5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center">
                  {art ? (
                    // Decorative: the category name sits immediately beside it.
                    <Image src={art} alt="" width={44} height={44} className="h-11 w-11" />
                  ) : (
                    <Icon className="h-5 w-5 text-primary-ink" aria-hidden />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium leading-tight">
                    {category.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-accent/50">
                    {category.product_count} ta e’lon
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <ProductRail title="Chegirmalar" href="/search?on_sale=true" products={deals.items} />
      <ProductRail title="Ommabop" href="/search?sort=rating" products={popular.items} />

      {/* Katalogdagi yangiliklar */}
      {newest.items.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl">Katalogdagi yangiliklar</h2>
            <Link
              href="/search?sort=newest"
              className="text-sm font-medium text-primary-ink hover:underline"
            >
              Barchasi →
            </Link>
          </div>
          <ProductGrid products={newest.items} />
          <div className="flex justify-center pt-2">
            <ButtonLink href="/search?sort=newest" variant="secondary" size="lg">
              Yana ko’rsatish
            </ButtonLink>
          </div>
        </section>
      ) : null}
    </div>
  );
}
