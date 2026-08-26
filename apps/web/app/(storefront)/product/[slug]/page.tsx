import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, FileText, Package, ShoppingBag, Star, Truck } from 'lucide-react';

import { ProductGrid } from '@/components/domain/product-card';
import { Price } from '@/components/domain/price';
import { Section } from '@/components/domain/section';
import {
  CertificationBadges,
  StockIndicator,
  VerifiedSellerBadge,
} from '@/components/domain/trust';
import { Alert, Badge, Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { AddToCart } from '@/features/cart/add-to-cart';
import { ApiError } from '@/lib/api-client';
import { ProductGallery } from '@/features/products/product-gallery';
import { catalog } from '@/lib/api-client/endpoints';
import { SITE_CURRENCY, formatDate, formatMoney } from '@/lib/utils/money';

export const revalidate = 120;

// Mirrors `pricing_service.FREE_SHIPPING_THRESHOLD_MINOR`. Copy, not policy:
// the API is what actually charges, and it decides on its own constant.
const FREE_SHIPPING_THRESHOLD_MINOR = 1_250_000;

async function load(slug: string) {
  try {
    return await catalog.product(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await load(params.slug);
  return product
    ? { title: product.name, description: product.description.slice(0, 155) }
    : { title: 'Mahsulot topilmadi' };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await load(params.slug);
  if (!product) notFound();

  const [related, reviews] = await Promise.all([
    catalog.related(params.slug).catch(() => []),
    catalog.reviews(params.slug).catch(() => ({ items: [], next_cursor: null })),
  ]);

  return (
    // Runs the full width of the shell rather than sitting inside the storefront's
    // 1200px measure, held off each edge by a proportional gutter so the layout
    // never touches the viewport border on a wide monitor.
    <div className="space-y-14 px-4 lg:px-gutter">
      <nav aria-label="Navigatsiya zanjiri" className="text-sm text-accent/50">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-primary-ink">
              Bosh sahifa
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/category/${product.category.slug}`} className="hover:text-primary-ink">
              {product.category.name}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-accent">{product.name}</li>
        </ol>
      </nav>

      {/* Galereya | mahsulot | xarid kartasi */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_20rem]">
        <ProductGallery images={product.images} name={product.name} />

        {/* Mahsulot haqida: nomi, sotuvchisi va tavsifi bir ustunda */}
        <div className="space-y-4">
          {product.brand ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-accent/50">
              {product.brand}
            </p>
          ) : null}
          <h1 className="text-3xl">{product.name}</h1>

          {/* Nomi, keyin bahosi, keyin sotuvchi belgisi */}
          {product.rating_average !== null ? (
            <span className="inline-flex items-center gap-1 text-sm text-accent/60">
              <Star className="h-3.5 w-3.5 fill-primary-ink text-primary-ink" aria-hidden />
              {product.rating_average.toFixed(1)}
              <span className="text-accent/40">({product.rating_count} sharh)</span>
            </span>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <VerifiedSellerBadge verified={product.seller.verified} />
            <CertificationBadges certifications={product.certifications} />
          </div>

          {product.prescription_required ? (
            <Alert tone="warning" title="Retsept talab qilinadi">
              Rasmiylashtirishda retsept yuklashingiz so’raladi. Buyurtma jo’natilishidan oldin uni
              litsenziyalangan mutaxassis tasdiqlaydi — sotuvchi hujjatni ko’rmaydi.
            </Alert>
          ) : null}

          {product.description ? (
            <div className="border-t border-accent/10 pt-4">
              <h2 className="text-sm font-medium">Mahsulot haqida</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-accent/75">
                {product.description}
              </p>
            </div>
          ) : null}
        </div>

        {/* Xarid kartasi, so‘ng sotuvchi kartasi */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="space-y-5 p-5">
            <div className="flex flex-wrap items-baseline gap-2">
              <Price
                amountMinor={product.price_amount_minor}
                currency={product.currency}
                unit={product.unit_label}
                size="lg"
              />
              {/* Display only — an order is always built from the selling
                  price, never from this (§5.1). */}
              {product.compare_at_amount_minor ? (
                <span className="text-sm text-accent/40 line-through">
                  {formatMoney(product.compare_at_amount_minor, product.currency)}
                </span>
              ) : null}
              {product.discount_percent ? (
                <Badge tone="primary">−{product.discount_percent}%</Badge>
              ) : null}
            </div>

            <AddToCart
              productId={product.id}
              maxQuantity={product.stock}
              disabled={!product.in_stock}
            />

            <ul className="space-y-2 border-t border-accent/10 pt-4 text-sm text-accent/70">
              {product.in_stock ? (
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-ink" aria-hidden />
                  <span>{product.stock} dona xarid qilish mumkin</span>
                </li>
              ) : null}
              {/* Real count of distinct buyers this week, straight from the API.
                  Absent rather than dressed up when nobody has bought yet. */}
              {product.buyers_last_7d > 0 ? (
                <li className="flex items-start gap-2">
                  <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-primary-ink" aria-hidden />
                  <span>Bu haftada {product.buyers_last_7d} kishi sotib oldi</span>
                </li>
              ) : null}
              <li className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary-ink" aria-hidden />
                <span>
                  Bu sotuvchining {formatMoney(FREE_SHIPPING_THRESHOLD_MINOR, SITE_CURRENCY)} dan
                  yuqori buyurtmalari uchun yetkazish bepul
                </span>
              </li>
              <li className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary-ink" aria-hidden />
                <Link href="/returns" className="hover:text-primary-ink hover:underline">
                  Ochilmagan mahsulotlarni 30 kun ichida qaytarish
                </Link>
              </li>
            </ul>
          </Card>

          <Card className="space-y-2 p-5">
            <p className="text-sm text-accent/60">
              Sotuvchi:{' '}
              <Link
                href={`/sellers/${product.seller.slug}`}
                className="font-medium text-primary-ink hover:underline"
              >
                {product.seller.business_name}
              </Link>{' '}
              · SKU {product.sku}
            </p>
            <StockIndicator stock={product.stock} inStock={product.in_stock} />
          </Card>
        </div>
      </div>

      {/* Xususiyatlar — tavsif yuqoriga, mahsulot ustuniga ko‘chdi */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Xususiyatlar</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <dl className="divide-y divide-accent/10">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 gap-4 px-5 py-3 text-sm">
                  <dt className="text-accent/60">{key}</dt>
                  <dd className="font-medium">{String(value)}</dd>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4 px-5 py-3 text-sm">
                <dt className="text-accent/60">Sertifikatlar</dt>
                <dd className="font-medium">
                  {product.certifications.length > 0 ? product.certifications.join(', ') : '—'}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-4 px-5 py-3 text-sm">
                <dt className="text-accent/60">O’lchov birligi</dt>
                <dd className="font-medium">{product.unit_label}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>

      {reviews.items.length > 0 ? (
        <Section title="Sharhlar" description={`${product.rating_count} ta xaridor sharhi`}>
          <ul className="grid gap-4 md:grid-cols-2">
            {reviews.items.map((review) => (
              <Card as="li" key={review.id} className="p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary-ink">
                    {review.author_initials}
                  </span>
                  <div>
                    <p className="flex items-center gap-1 text-sm font-medium">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <Star
                          key={index}
                          className="h-3.5 w-3.5 fill-primary-ink text-primary-ink"
                          aria-hidden
                        />
                      ))}
                      <span className="sr-only">5 dan {review.rating}</span>
                    </p>
                    <p className="text-xs text-accent/50">
                      {formatDate(review.created_at)}
                      {review.verified_purchase ? ' · Tasdiqlangan xarid' : ''}
                    </p>
                  </div>
                </div>
                {review.title ? <p className="mt-3 text-sm font-semibold">{review.title}</p> : null}
                <p className="mt-1.5 text-sm text-accent/70">{review.body}</p>
              </Card>
            ))}
          </ul>
        </Section>
      ) : null}

      {related.length > 0 ? (
        <Section title="O’xshash mahsulotlar" description={`${product.category.name} turkumida`}>
          <ProductGrid products={related} />
        </Section>
      ) : null}
    </div>
  );
}
