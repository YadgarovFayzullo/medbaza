import { PageHeader } from '@/components/domain/section';
import { CartView } from '@/features/cart/cart-view';

// Savat hech qachon keshlanmaydi.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Savat' };

export default function CartPage() {
  return (
    <div>
      <PageHeader
        title="Savat"
        description="Sotuvchilar bo’yicha guruhlangan — xuddi jo’natilgani kabi."
      />
      <CartView />
    </div>
  );
}
