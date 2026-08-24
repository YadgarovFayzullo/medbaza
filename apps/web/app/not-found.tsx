import { SearchX } from 'lucide-react';

import { ButtonLink } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <SearchX className="h-8 w-8 text-primary-ink" aria-hidden />
      <h1 className="text-2xl">Sahifa topilmadi</h1>
      <p className="max-w-sm text-sm text-accent/60">
        Havola eskirgan bo’lishi mumkin yoki e’lonni sotuvchi arxivlagan.
      </p>
      <ButtonLink href="/">Do’konga qaytish</ButtonLink>
    </div>
  );
}
