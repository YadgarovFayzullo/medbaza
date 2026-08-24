import { Suspense } from 'react';

import { AuthForm } from '@/features/auth/auth-form';
import { Skeleton } from '@/components/ui';

export const metadata = { title: 'Kirish' };

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
