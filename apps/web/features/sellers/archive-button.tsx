'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Archive, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';
import { ApiError, request } from '@/lib/api-client';

/**
 * Arxivlash — yumshoq o‘chirish: buyurtma qilingan e’lon saqlanib qoladi (§7).
 *
 * Restoring is part of the same control on purpose. A soft delete that cannot
 * be undone is a delete with extra steps, and an archived listing previously
 * offered nothing but the word "archived".
 */
export function ArchiveListingButton({
  productId,
  archived,
}: {
  productId: string;
  archived: boolean;
}) {
  const router = useRouter();
  const { getToken } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (archived) {
        // Back as a draft, never straight to the storefront: the seller decides
        // when it goes live, and going live re-runs the certification check.
        await request(`/seller/products/${productId}`, {
          method: 'PATCH',
          body: { status: 'draft' },
          token,
        });
      } else {
        await request(`/seller/products/${productId}`, { method: 'DELETE', token });
      }
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : archived
            ? 'E’lonni tiklab bo’lmadi.'
            : 'E’lonni arxivlab bo’lmadi.',
      );
    } finally {
      // The page stays put either way, so nothing unmounts this component and
      // a failed request would otherwise leave the button spinning.
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="secondary" loading={busy} onClick={run}>
        {archived ? (
          <>
            <RotateCcw className="h-4 w-4" aria-hidden />
            E’lonni tiklash
          </>
        ) : (
          <>
            <Archive className="h-4 w-4" aria-hidden />
            E’lonni arxivlash
          </>
        )}
      </Button>
      {archived && !error ? (
        <span className="text-xs text-accent/50">Arxivlangan — xaridorlarga ko’rinmaydi</span>
      ) : null}
      {error ? <span className="text-xs font-medium text-accent">{error}</span> : null}
    </div>
  );
}
