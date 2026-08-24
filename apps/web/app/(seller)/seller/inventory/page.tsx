import { Boxes } from 'lucide-react';

import { PageHeader } from '@/components/domain/section';
import { EmptyState } from '@/components/ui';
import { InventoryTable } from '@/features/sellers/inventory-table';
import { seller } from '@/lib/api-client/endpoints';
import { requireSession } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Ombor' };

export default async function InventoryPage() {
  const session = await requireSession('/seller/inventory');
  const page = await seller.products(session.accessToken, { status: 'active' });

  return (
    <div>
      <PageHeader
        title="Ombor"
        description="Qoldiq buyurtma yaratilganda band qilinadi — bu yerdagi son xaridorlar sotib ola oladigan miqdor."
      />
      {page.items.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Efirda e’lon yo’q"
          description="Qoldiqni boshqarish uchun e’lonni chop eting."
        />
      ) : (
        <InventoryTable products={page.items} />
      )}
    </div>
  );
}
