import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { CARD_RAIL_ITEM, ProductCard } from '@/components/domain/product-card';
import type { ProductListItem } from '@/lib/api-client/endpoints';

/**
 * A horizontally scrolling row of cards. Scrolling is contained here, so the
 * page body never scrolls sideways on a narrow screen.
 */
export function ProductRail({
  title,
  href,
  products,
}: {
  title: string;
  href: string;
  products: ProductListItem[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-4">
      <Link href={href} className="group inline-flex items-center gap-1.5">
        <h2 className="text-2xl">{title}</h2>
        <ChevronRight
          className="h-5 w-5 text-accent/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-ink"
          aria-hidden
        />
      </Link>

      {/* No negative margin: bleeding past the container would leave the rail
          16px wider than the hero, the tiles, and the grid below it. */}
      <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {products.map((product) => (
          <li key={product.id} className={CARD_RAIL_ITEM}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
