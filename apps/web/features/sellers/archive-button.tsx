'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Archive } from 'lucide-react';

import { Button } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';
import { request } from '@/lib/api-client';

/** Arxivlash — yumshoq o‘chirish: buyurtma qilingan e’lon saqlanib qoladi (§7). */
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

  if (archived) return <span className="text-sm text-accent/50">Arxivlangan</span>;

  return (
    <Button
      variant="secondary"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        const token = await getToken();
        await request(`/seller/products/${productId}`, { method: 'DELETE', token });
        setBusy(false);
        router.refresh();
      }}
    >
      <Archive className="h-4 w-4" aria-hidden />
      E’lonni arxivlash
    </Button>
  );
}
