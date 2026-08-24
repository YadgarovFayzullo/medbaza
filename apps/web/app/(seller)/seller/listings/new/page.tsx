import { PageHeader } from '@/components/domain/section';
import { ListingForm } from '@/features/sellers/listing-form';
import { catalog } from '@/lib/api-client/endpoints';
import { requireSession } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Yangi e’lon' };

export default async function NewListingPage() {
  await requireSession('/seller/listings/new');
  const categories = await catalog.categories();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Yangi e’lon"
        description="Tartibga solinadigan turkumlarda efirga chiqish uchun CE, FDA yoki ISO sertifikati kerak."
      />
      <ListingForm categories={categories} />
    </div>
  );
}
