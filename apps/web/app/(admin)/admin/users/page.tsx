import Link from 'next/link';
import { Users } from 'lucide-react';

import { PageHeader } from '@/components/domain/section';
import { Badge, ButtonLink, EmptyState, TableWrap, Td, Th } from '@/components/ui';
import { UserRoleActions } from '@/features/auth/user-role-actions';
import { admin } from '@/lib/api-client/endpoints';
import { requireRole } from '@/lib/auth/guards';
import { formatDate } from '@/lib/utils/money';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Foydalanuvchilar' };

const FILTERS = [
  { label: 'Barchasi', value: '' },
  { label: 'Xaridorlar', value: 'buyer' },
  { label: 'Sotuvchilar', value: 'seller' },
  { label: 'Adminlar', value: 'admin' },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; q?: string; cursor?: string };
}) {
  const session = await requireRole('admin', '/admin/users');
  const page = await admin.users(session.accessToken, {
    role: searchParams.role,
    q: searchParams.q,
    cursor: searchParams.cursor,
  });

  return (
    <div>
      <PageHeader title="Foydalanuvchilar" description="Rollar va hisob holati." />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <ul className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <li key={filter.label}>
              <Link
                href={filter.value ? `/admin/users?role=${filter.value}` : '/admin/users'}
                className={`inline-block rounded-full border px-3.5 py-1.5 text-sm ${
                  (searchParams.role ?? '') === filter.value
                    ? 'border-primary-ink/50 bg-primary/10 font-medium text-primary-ink'
                    : 'border-accent/15 bg-white text-accent/70 hover:border-accent/30'
                }`}
              >
                {filter.label}
              </Link>
            </li>
          ))}
        </ul>

        <form action="/admin/users" className="ml-auto flex items-center gap-2">
          {searchParams.role ? <input type="hidden" name="role" value={searchParams.role} /> : null}
          <label htmlFor="user-search" className="sr-only">
            Pochta bo’yicha qidirish
          </label>
          <input
            id="user-search"
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder="Pochta bo’yicha qidirish…"
            className="rounded-lg border border-accent/15 bg-white px-3 py-2 text-sm focus:border-primary-ink/50 focus:outline-none focus:ring-2 focus:ring-primary-ink/30"
          />
        </form>
      </div>

      {page.items.length === 0 ? (
        <EmptyState icon={Users} title="Mos foydalanuvchi topilmadi" />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Foydalanuvchi</Th>
              <Th>Ro’yxatdan o’tgan</Th>
              <Th>Rol</Th>
              <Th>Holat</Th>
              <Th>Boshqarish</Th>
            </tr>
          </thead>
          <tbody>
            {page.items.map((user) => (
              <tr key={user.id}>
                <Td>
                  <span className="font-medium">{user.full_name}</span>
                  <span className="block text-xs text-accent/50">{user.email}</span>
                </Td>
                <Td className="text-accent/60">{formatDate(user.created_at)}</Td>
                <Td>
                  <Badge tone={user.role === 'admin' ? 'primary' : 'muted'}>{user.role}</Badge>
                </Td>
                <Td className="text-accent/60">{user.is_active ? 'Faol' : 'O’chirilgan'}</Td>
                <Td>
                  <UserRoleActions
                    userId={user.id}
                    role={user.role}
                    isActive={user.is_active}
                    isSelf={user.id === session.user.id}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {page.next_cursor ? (
        <div className="flex justify-center pt-6">
          <ButtonLink variant="secondary" href={`/admin/users?cursor=${page.next_cursor}`}>
            Yana ko’rsatish
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
