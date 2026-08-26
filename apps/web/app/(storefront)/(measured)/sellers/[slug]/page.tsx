import { notFound } from 'next/navigation';

import { ProductGrid } from '@/components/domain/product-card';
import { PageHeader } from '@/components/domain/section';
import { VerifiedSellerBadge } from '@/components/domain/trust';
import { Card } from '@/components/ui';
import { ApiError } from '@/lib/api-client';
import { catalog } from '@/lib/api-client/endpoints';

export const revalidate = 300;

async function load(slug: string) {
  try {
    return await catalog.seller(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const seller = await load(params.slug);
  return { title: seller?.business_name ?? 'Sotuvchi' };
}

export default async function SellerPage({ params }: { params: { slug: string } }) {
  const seller = await load(params.slug);
  if (!seller) notFound();

  const listings = await catalog.products({ seller: params.slug, limit: 24 });

  return (
    <div className="space-y-8">
      <PageHeader title={seller.business_name} description={seller.description ?? undefined} />

      <Card className="flex flex-wrap items-center gap-6 p-5 text-sm">
        <VerifiedSellerBadge verified={seller.verified} />
        <span className="text-accent/60">
          Jo’natish: <span className="font-medium text-accent">{seller.country}</span>
        </span>
        <span className="text-accent/60">
          <span className="font-medium text-accent">{seller.product_count}</span> ta faol e’lon
        </span>
      </Card>

      <ProductGrid products={listings.items} />
    </div>
  );
}
