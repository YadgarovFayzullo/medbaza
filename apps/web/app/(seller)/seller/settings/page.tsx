import { PageHeader } from '@/components/domain/section';
import { StatusBadge } from '@/components/domain/status-badge';
import { Alert } from '@/components/ui';
import { SellerSettingsForm } from '@/features/sellers/settings-form';
import { seller } from '@/lib/api-client/endpoints';
import { requireSession } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Sotuvchi hisobi' };

export default async function SellerSettingsPage() {
  const session = await requireSession('/seller/settings');
  const account = await seller.me(session.accessToken);

  return (
    // Same width as the listing form — every form page in the panel reads at
    // one measure, and the index pages stay full width for their tables.
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Sotuvchi hisobi"
        description="Do’koningiz ma’lumotlari va muvofiqlik guruhi tekshiradigan hujjatlar."
        actions={<StatusBadge status={account.status} />}
      />

      <div className="space-y-6">
        {account.rejection_reason ? (
          <Alert tone="warning" title="Tekshiruv izohi">
            {account.rejection_reason}
          </Alert>
        ) : null}
        <SellerSettingsForm account={account} />
      </div>
    </div>
  );
}
