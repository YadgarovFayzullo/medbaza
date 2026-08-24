import Link from 'next/link';
import { Package, Star } from 'lucide-react';

import { SaveButton } from '@/components/domain/save-button';
import { QuickAddToCart } from '@/features/cart/quick-add';
import type { ProductListItem } from '@/lib/api-client/endpoints';
import { cn } from '@/lib/utils/cn';
import { formatMoney } from '@/lib/utils/money';

/**
 * Zich marketplace kartochkasi: rasm, belgilar, eski/yangi narx, nom, reyting va
 * bitta asosiy amal. Ajratish — ingichka chegara va fon pog‘onasi, hech qachon
 * soya emas (CLAUDE.md §9).
 */
export function ProductCard({ product }: { product: ProductListItem }) {
  const href = `/product/${product.slug}`;

  return (
    <article className="group flex h-full flex-col rounded-lg bg-white transition-shadow hover:shadow-card">
      <div className="relative">
        <Link
          href={href}
          className="flex aspect-square items-center justify-center overflow-hidden rounded-t-lg bg-base"
          tabIndex={-1}
          aria-hidden={product.image_url ? undefined : true}
        >
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <Package className="h-9 w-9 text-accent/15" aria-hidden />
          )}
        </Link>

        <SaveButton
          productSlug={product.slug}
          productName={product.name}
          className="absolute right-2 top-2"
        />

        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
          {product.discount_percent ? <Tag emphasis>−{product.discount_percent}%</Tag> : null}
          {product.seller.verified ? <Tag>Tasdiqlangan</Tag> : null}
          {product.prescription_required ? <Tag>Retsept</Tag> : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[15px] font-semibold leading-tight text-accent">
            {formatMoney(product.price_amount_minor, product.currency)}
          </span>
          {product.compare_at_amount_minor ? (
            <span className="text-xs text-accent/40 line-through">
              {formatMoney(product.compare_at_amount_minor, product.currency)}
            </span>
          ) : null}
        </div>

        {product.brand ? (
          <p className="text-[11px] font-medium uppercase tracking-wide text-accent/45">
            {product.brand}
          </p>
        ) : null}

        <h3 className="text-[13px] leading-snug">
          <Link href={href} className="line-clamp-2 text-accent hover:text-primary-ink">
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto space-y-2 pt-1">
          <div className="flex items-center gap-2 text-[11px] text-accent/55">
            {product.rating_average !== null ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3 fill-primary-ink text-primary-ink" aria-hidden />
                <span className="font-medium text-accent">{product.rating_average.toFixed(1)}</span>
                <span>({product.rating_count})</span>
              </span>
            ) : (
              <span>Sharh yo’q</span>
            )}
            {product.certifications.length > 0 ? (
              <span className="ml-auto truncate">{product.certifications.join(' · ')}</span>
            ) : null}
          </div>

          <QuickAddToCart
            productId={product.id}
            productName={product.name}
            inStock={product.in_stock}
            stock={product.stock}
          />
        </div>
      </div>
    </article>
  );
}

function Tag({ children, emphasis }: { children: React.ReactNode; emphasis?: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-4',
        emphasis
          ? 'border-primary/30 bg-primary-ink text-white'
          : 'border-accent/10 bg-white text-accent/70',
      )}
    >
      {children}
    </span>
  );
}

/**
 * The card grid's shape, and the matching width for a single card in a
 * horizontally scrolling row.
 *
 * They live together because they have to agree: a rail with its own fixed
 * widths renders visibly narrower cards than the grid on the same page. The
 * rail widths are the grid's column width written out — for `n` columns at
 * `gap-3` (0.75rem), a column is `(100% - (n-1) * 0.75rem) / n`.
 */
export const CARD_GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

/**
 * Four across at the widest, for a grid that shares its row with the filter
 * rail. A fifth column there is narrower than the same card on the home page,
 * which makes the two pages look like different card sizes.
 */
export const CARD_GRID_NARROW = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4';

export const CARD_RAIL_ITEM =
  'w-[calc((100%-0.75rem)/2)] shrink-0 snap-start ' +
  'sm:w-[calc((100%-1.5rem)/3)] lg:w-[calc((100%-2.25rem)/4)] xl:w-[calc((100%-3rem)/5)]';

export function ProductGrid({
  products,
  columns = 5,
  className,
}: {
  products: ProductListItem[];
  /** Widest-breakpoint column count. Whole class strings, so Tailwind sees them. */
  columns?: 4 | 5;
  className?: string;
}) {
  return (
    <div className={cn(columns === 4 ? CARD_GRID_NARROW : CARD_GRID, className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
