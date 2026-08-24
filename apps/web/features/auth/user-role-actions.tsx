'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert, Button, Select } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';
import { ApiError, request } from '@/lib/api-client';

const ROLES = ['buyer', 'seller', 'admin'] as const;

/** Rol o‘zgarishi ham, hisobni o‘chirish ham auditga yoziladi (CLAUDE.md §12.3). */
export function UserRoleActions({
  userId,
  role,
  isActive,
  isSelf,
}: {
  userId: string;
  role: string;
  isActive: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const { getToken } = useSession();
  const [nextRole, setNextRole] = useState(role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await request(`/admin/users/${userId}`, { method: 'PATCH', token, body });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Foydalanuvchini yangilab bo’lmadi.');
    } finally {
      setBusy(false);
    }
  }

  if (isSelf) {
    return <span className="text-xs text-accent/50">Bu sizsiz</span>;
  }

  return (
    <div className="space-y-2">
      {error ? <Alert tone="warning">{error}</Alert> : null}
      <div className="flex flex-wrap items-end gap-2">
        <Select
          aria-label="Rol"
          value={nextRole}
          onChange={(event) => setNextRole(event.target.value)}
          className="w-32"
        >
          {ROLES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Button
          size="sm"
          variant="secondary"
          loading={busy}
          disabled={nextRole === role}
          onClick={() => apply({ role: nextRole, reason: 'Admin paneli orqali o’zgartirildi' })}
        >
          Rolni saqlash
        </Button>
        <Button
          size="sm"
          variant="ghost"
          loading={busy}
          onClick={() =>
            apply({ is_active: !isActive, reason: 'Admin paneli orqali o’zgartirildi' })
          }
        >
          {isActive ? 'O’chirish' : 'Yoqish'}
        </Button>
      </div>
    </div>
  );
}
