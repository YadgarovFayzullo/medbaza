import { Suspense } from 'react';

import { AuthForm } from '@/features/auth/auth-form';
import { Skeleton } from '@/components/ui';

export const metadata = { title: 'Hisob yaratish' };

export default function RegisterPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
