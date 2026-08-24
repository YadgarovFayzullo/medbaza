import { PageHeader } from '@/components/domain/section';
import { GuestOrderLookup } from '@/features/orders/guest-lookup';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Buyurtmani kuzatish' };

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Mehmon buyurtmasini kuzatish"
        description="Faqat buyurtma raqami yetarli emas — siz kiritgan pochtani ham so’raymiz."
      />
      <GuestOrderLookup />
    </div>
  );
}
