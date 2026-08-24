'use client';

import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="h-8 w-8 text-primary-ink" aria-hidden />
      <h1 className="text-2xl">Xatolik yuz berdi</h1>
      {/* Xabar matni ataylab ko‘rsatilmaydi: unda xaridorga tegishli bo‘lmagan
          tafsilotlar bo‘lishi mumkin. */}
      <p className="max-w-sm text-sm text-accent/60">
        Muammoni qayd etdik. Qayta urinib ko’ring, takrorlansa bizga xabar bering.
      </p>
      <Button onClick={reset}>Qayta urinish</Button>
    </div>
  );
}
