import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { ProductGrid } from '@/components/domain/product-card';
import { EmptyState } from '@/components/ui';
import { FilterPanel, SortSelect } from '@/features/products/filter-panel';
import { catalog, type ProductQuery } from '@/lib/api-client/endpoints';
import { toMinor } from '@/lib/utils/money';

export interface BrowseParams {
  q?: string;
  brand?: string;
  certification?: string;
  min_price?: string;
  max_price?: string;
  in_stock?: string;
  on_sale?: string;
  rx?: string;
  sort?: string;
  cursor?: string;
}

/** URL parametrlari -> API'ning ruxsat etilgan so'rovi. Hech narsa xom ko'chirilmaydi. */
function toQuery(params: BrowseParams, category?: string): ProductQuery {
  return {
    q: params.q,
    category,
    brand: params.brand,
    certification: params.certification,
    min_price_minor: params.min_price ? toMinor(Number(params.min_price)) : undefined,
    max_price_minor: params.max_price ? toMinor(Number(params.max_price)) : undefined,
    in_stock: params.in_stock === 'true' ? true : undefined,
    on_sale: params.on_sale === 'true' ? true : undefined,
    prescription_required: params.rx === 'true' ? true : params.rx === 'false' ? false : undefined,
    sort: params.sort ?? 'relevance',
    cursor: params.cursor,
    limit: 24,
  };
}

function buildHref(basePath: string, params: BrowseParams, cursor: string): string {
  const next = new URLSearchParams(
    Object.entries(params).filter(([, value]) => Boolean(value)) as [string, string][],
  );
  next.set('cursor', cursor);
  return `${basePath}?${next.toString()}`;
}

export async function ProductBrowser({
  basePath,
  category,
  params,
  title,
  children,
}: {
  basePath: string;
  category?: string;
  params: BrowseParams;
  /** The page's own heading. It lives here so the result count, which only this
   *  component knows, can sit under it as the subtitle. */
  title: string;
  /** Anything that belongs directly under that subtitle — the category page's
   *  sub-category links, for one. */
  children?: React.ReactNode;
}) {
  const [page, brands] = await Promise.all([
    catalog.products(toQuery(params, category)),
    catalog.brands(category),
  ]);

  // The count is the subtitle, not a separate toolbar line. "(shu sahifada)"
  // stays on it because the API returns a cursor page, not a total — dropping
  // the hedge would claim a number we do not have.
  const counted = `Tanlovda ${page.items.length} ta mahsulot${
    page.next_cursor ? ' (shu sahifada)' : ''
  }`;
  const subtitle = children ? `${counted} — quyidagi bo’limlardan` : counted;

  return (
    /*
     * Explicit placement rather than source order: the heading block — title,
     * count, and whatever narrows the listing — sits over the cards in column
     * two, so its left edge is the first card's, and the filter panel runs
     * beside the whole thing. Source order still drives the single-column
     * layout below lg, where the heading must come before the filter toggle.
     */
    <div className="grid gap-x-6 gap-y-5 lg:grid-cols-[260px_1fr]">
      <header className="flex flex-wrap items-end justify-between gap-4 lg:col-start-2 lg:row-start-1">
        <div className="space-y-2">
          <h1 className="text-3xl">{title}</h1>
          <p className="text-sm text-accent/60">{subtitle}</p>
          {children}
        </div>
        <SortSelect />
      </header>

      {/* A grid item, not the <aside> itself: FilterPanel renders a toggle plus
          the panel, and the sticky panel needs a full-height parent to travel
          inside. This wrapper stretches to the row; the panel does not. */}
      <div className="space-y-3 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <FilterPanel brands={brands} />
      </div>

      <div className="space-y-5 lg:col-start-2 lg:row-start-2">
        {page.items.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Bu filtrlarga mos mahsulot topilmadi"
            description="Narx oralig’ini kengaytiring yoki sertifikat filtrini olib tashlang."
          />
        ) : (
          <ProductGrid products={page.items} columns={4} />
        )}

        {page.next_cursor ? (
          <div className="flex justify-center pt-4">
            {/* Kursorli sahifalash: katalog o’qish paytida o’zgaradi, shuning uchun
                sahifa raqamlari yo’q (CLAUDE.md §6). */}
            <Link
              href={buildHref(basePath, params, page.next_cursor)}
              className="inline-flex h-11 items-center rounded-lg border border-accent/15 bg-white px-5 text-sm font-medium hover:border-accent/30"
            >
              Yana ko’rsatish
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
