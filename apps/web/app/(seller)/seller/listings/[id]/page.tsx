import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/domain/section';
import { ListingForm } from '@/features/sellers/listing-form';
import { ArchiveListingButton } from '@/features/sellers/archive-button';
import { ApiError } from '@/lib/api-client';
import { catalog, seller } from '@/lib/api-client/endpoints';
import { requireSession } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const session = await requireSession(`/seller/listings/${params.id}`);

  const product = await seller.product(session.accessToken, params.id).catch((error) => {
    // Boshqa sotuvchining e’loni «yo‘q» deb ko‘rsatiladi, «taqiqlangan» deb emas.
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });
  if (!product) notFound();

  const categories = await catalog.categories();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/seller/listings" className="text-sm text-primary-ink hover:underline">
        ← Barcha e’lonlar
      </Link>
      <PageHeader
        title={product.name}
        description={`SKU ${product.sku}`}
        actions={
          <ArchiveListingButton productId={product.id} archived={product.status === 'archived'} />
        }
      />
      <ListingForm categories={categories} product={product} />
    </div>
  );
}
