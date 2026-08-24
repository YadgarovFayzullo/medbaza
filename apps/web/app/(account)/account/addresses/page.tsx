import { PageHeader } from '@/components/domain/section';
import { AddressBook } from '@/features/orders/address-book';
import { account } from '@/lib/api-client/endpoints';
import { requireSession } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Manzillar' };

export default async function AddressesPage() {
  const session = await requireSession('/account/addresses');
  const addresses = await account.addresses(session.accessToken);

  return (
    <div>
      <PageHeader
        title="Saqlangan manzillar"
        description="Buyurtma tanlangan manzil nusxasini saqlaydi — bu yerdagi tahrir eski buyurtmani o’zgartirmaydi."
      />
      <AddressBook addresses={addresses} />
    </div>
  );
}
