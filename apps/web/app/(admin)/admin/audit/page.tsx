import { ScrollText } from 'lucide-react';

import { PageHeader } from '@/components/domain/section';
import { ButtonLink, EmptyState, TableWrap, Td, Th } from '@/components/ui';
import { admin } from '@/lib/api-client/endpoints';
import { requireRole } from '@/lib/auth/guards';
import { formatDateTime } from '@/lib/utils/money';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Audit jurnali' };

export default async function AuditPage({
  searchParams,
}: {
  searchParams: { action?: string; cursor?: string };
}) {
  const session = await requireRole('admin', '/admin/audit');
  const page = await admin.audit(session.accessToken, {
    action: searchParams.action,
    cursor: searchParams.cursor,
  });

  return (
    <div>
      <PageHeader
        title="Audit jurnali"
        description="Faqat qo’shiladi. Yozuvlarda ID bo’ladi — ism, manzil yoki hujjat mazmuni emas."
      />

      {page.items.length === 0 ? (
        <EmptyState icon={ScrollText} title="Hozircha yozuv yo’q" />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Vaqt</Th>
              <Th>Amal</Th>
              <Th>Obyekt</Th>
              <Th>Kim</Th>
            </tr>
          </thead>
          <tbody>
            {page.items.map((entry) => (
              <tr key={entry.id}>
                <Td className="whitespace-nowrap text-accent/60">
                  {formatDateTime(entry.created_at)}
                </Td>
                <Td className="font-medium">{entry.action.replace(/[._]/g, ' ')}</Td>
                <Td className="text-accent/60">
                  {entry.subject_type}{' '}
                  <span className="font-mono text-xs">{entry.subject_id.slice(0, 8)}</span>
                </Td>
                <Td className="text-accent/60">
                  {entry.actor_role}{' '}
                  <span className="font-mono text-xs">
                    {entry.actor_id ? entry.actor_id.slice(0, 8) : 'system'}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {page.next_cursor ? (
        <div className="flex justify-center pt-6">
          <ButtonLink variant="secondary" href={`/admin/audit?cursor=${page.next_cursor}`}>
            Eski yozuvlar
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
