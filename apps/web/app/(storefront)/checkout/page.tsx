import { PageHeader } from '@/components/domain/section';
import { CheckoutFlow } from '@/features/checkout/checkout-flow';

// Rasmiylashtirish dinamik va hech qachon keshlanmaydi (CLAUDE.md §3.8).
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Rasmiylashtirish' };

export default function CheckoutPage() {
  return (
    <div>
      <PageHeader
        title="Rasmiylashtirish"
        description="Mehmon yoki hisob bilan — har bir narx va qoldiqni server tasdiqlaydi."
      />
      <CheckoutFlow />
    </div>
  );
}
