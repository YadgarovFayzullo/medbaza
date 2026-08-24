import Link from 'next/link';
import { Activity } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-12">
      <Link href="/" className="flex items-center gap-2 text-lg font-medium">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-ink text-white">
          <Activity className="h-4 w-4" aria-hidden />
        </span>
        MedBaza
      </Link>
      <main id="main" className="w-full max-w-md">
        {children}
      </main>
    </div>
  );
}
