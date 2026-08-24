import Link from 'next/link';
import { Store } from 'lucide-react';

import { PageHeader } from '@/components/domain/section';
import { StatusBadge } from '@/components/domain/status-badge';
import { ButtonLink, EmptyState, TableWrap, Td, Th } from '@/components/ui';
import { VerificationActions } from '@/features/sellers/verification-actions';
import { admin } from '@/lib/api-client/endpoints';
import { requireRole } from '@/lib/auth/guards';
import { formatDate } from '@/lib/utils/money';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Sotuvchilar' };

const FILTERS = [
  { label: 'Kutilmoqda', value: 'pending' },
  { label: 'Tasdiqlangan', value: 'verified' },
  { label: 'Rad etilgan', value: 'rejected' },
  { label: 'To’xtatilgan', value: 'suspended' },
  { label: 'Barchasi', value: '' },
];

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: { status?: string; cursor?: string };
}) {
  const session = await requireRole('admin', '/admin/sellers');
  const page = await admin.sellers(session.accessToken, {
    status: searchParams.status,
    cursor: searchParams.cursor,
  });

  return (
    <div>
      <PageHeader
        title="Sotuvchilar"
        description="Tasdiqlang, rad eting yoki to’xtating. To’xtatilsa, sotuvchi e’lonlari do’kondan olib tashlanadi."
      />

      <ul className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <li key={filter.label}>
            <Link
              href={filter.value ? `/admin/sellers?status=${filter.value}` : '/admin/sellers'}
              className={`inline-block rounded-full border px-3.5 py-1.5 text-sm ${
                (searchParams.status ?? '') === filter.value
                  ? 'border-primary-ink/50 bg-primary/10 font-medium text-primary-ink'
                  : 'border-accent/15 bg-white text-accent/70 hover:border-accent/30'
              }`}
            >
              {filter.label}
            </Link>
          </li>
        ))}
      </ul>

      {page.items.length === 0 ? (
        <EmptyState icon={Store} title="Bu navbat bo’sh" />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Tashkilot</Th>
              <Th>Davlat</Th>
              <Th>Litsenziya</Th>
              <Th>Ariza sanasi</Th>
              <Th>Holat</Th>
              <Th>Qaror</Th>
            </tr>
          </thead>
          <tbody>
            {page.items.map((row) => (
              <tr key={row.id}>
                <Td>
                  <span className="font-medium">{row.business_name}</span>
                  <span className="block text-xs text-accent/50">{row.contact_email}</span>
                </Td>
                <Td className="text-accent/60">{row.country}</Td>
                <Td className="text-accent/60">
                  {row.license_number ?? '—'}
                  {row.certification_documents.length > 0 ? (
                    <span className="block text-xs text-accent/40">
                      {row.certification_documents.length} ta hujjat
                    </span>
                  ) : null}
                </Td>
                <Td className="text-accent/60">{formatDate(row.created_at)}</Td>
                <Td>
                  <StatusBadge status={row.status} />
                </Td>
                <Td>
                  <VerificationActions sellerId={row.id} status={row.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {page.next_cursor ? (
        <div className="flex justify-center pt-6">
          <ButtonLink
            variant="secondary"
            href={`/admin/sellers?${new URLSearchParams({
              ...(searchParams.status ? { status: searchParams.status } : {}),
              cursor: page.next_cursor,
            })}`}
          >
            Yana ko’rsatish
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
