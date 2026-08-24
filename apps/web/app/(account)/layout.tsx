import { FileText, MapPin, Package } from 'lucide-react';
import { headers } from 'next/headers';

import { DashboardShell, type NavItem } from '@/components/domain/dashboard-shell';
import { requireSession } from '@/lib/auth/guards';

const NAV: NavItem[] = [
  { label: 'Buyurtmalar', href: '/account', icon: Package },
  { label: 'Manzillar', href: '/account/addresses', icon: MapPin },
  { label: 'Retseptlar', href: '/account/prescriptions', icon: FileText },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireSession('/account');
  const activePath = headers().get('x-pathname') ?? '/account';

  return (
    <DashboardShell title="Mening hisobim" nav={NAV} activePath={activePath}>
      {children}
    </DashboardShell>
  );
}
