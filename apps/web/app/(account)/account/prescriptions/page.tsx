import { PageHeader } from '@/components/domain/section';
import { Alert } from '@/components/ui';
import { PrescriptionManager } from '@/features/prescriptions/prescription-manager';
import { prescriptions } from '@/lib/api-client/endpoints';
import { requireSession } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Retseptlar' };

export default async function PrescriptionsPage() {
  const session = await requireSession('/account/prescriptions');
  const page = await prescriptions.list(session.accessToken);

  return (
    <div>
      <PageHeader
        title="Retseptlar"
        description="Yuklangan hujjatlar va ularning tekshiruv holati."
      />
      <div className="space-y-6">
        <Alert tone="info" title="Kim ko’ra oladi">
          Faqat siz va litsenziyalangan mutaxassislarimiz. Sotuvchiga faqat talab bajarilgani
          aytiladi; hujjat har ochilganda audit jurnaliga yoziladi.
        </Alert>
        <PrescriptionManager prescriptions={page.items} />
      </div>
    </div>
  );
}
