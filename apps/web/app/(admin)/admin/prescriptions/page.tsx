import { FileCheck2 } from 'lucide-react';

import { PageHeader } from '@/components/domain/section';
import { StatusBadge } from '@/components/domain/status-badge';
import { Alert, ButtonLink, EmptyState, TableWrap, Td, Th } from '@/components/ui';
import { PrescriptionReviewActions } from '@/features/prescriptions/review-actions';
import { admin } from '@/lib/api-client/endpoints';
import { requireRole } from '@/lib/auth/guards';
import { formatDateTime } from '@/lib/utils/money';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Retsept tekshiruvi' };

export default async function AdminPrescriptionsPage({
  searchParams,
}: {
  searchParams: { cursor?: string };
}) {
  const session = await requireRole('admin', '/admin/prescriptions');
  const page = await admin.prescriptions(session.accessToken, searchParams.cursor);

  return (
    <div>
      <PageHeader
        title="Retsept tekshiruvi"
        description="Eskilari birinchi. Retsept tasdiqlanmaguncha buyurtma «to’langan» holatidan chiqmaydi."
      />

      <div className="space-y-5">
        <Alert tone="info" title="Ishlash qoidalari">
          Hujjatni ochish besh daqiqada muddati tugaydigan havola yaratadi va audit yozuvini
          qoldiradi. Rad etishda xaridor tushunadigan sabab kerak. Sotuvchi hujjatni olmaydi.
        </Alert>

        {page.items.length === 0 ? (
          <EmptyState
            icon={FileCheck2}
            title="Navbat bo’sh"
            description="Hozircha tekshiruv kutayotgan hujjat yo’q."
            action={
              <ButtonLink href="/admin" variant="secondary">
                Umumiy ko’rinishga
              </ButtonLink>
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Hujjat</Th>
                <Th>Xaridor</Th>
                <Th>Yuklangan</Th>
                <Th>Holat</Th>
                <Th>Qaror</Th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((row) => (
                <tr key={row.id}>
                  <Td>
                    <span className="font-medium">{row.original_filename}</span>
                    <span className="block text-xs text-accent/50">
                      {row.content_type} · {Math.round(row.byte_size / 1024)} KB
                    </span>
                  </Td>
                  {/* Faqat ID — ism yoki pochta emas: bu ro‘yxat buning joyi emas. */}
                  <Td className="font-mono text-xs text-accent/60">{row.user_id.slice(0, 8)}</Td>
                  <Td className="text-accent/60">{formatDateTime(row.created_at)}</Td>
                  <Td>
                    <StatusBadge status={row.status} />
                  </Td>
                  <Td>
                    <PrescriptionReviewActions prescriptionId={row.id} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </div>
    </div>
  );
}
