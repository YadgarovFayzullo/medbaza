import { FileText, MapPin, Package } from 'lucide-react';

import { DashboardShell, type NavItem } from '@/components/domain/dashboard-shell';
import { requireSession } from '@/lib/auth/guards';

const NAV: NavItem[] = [
  { label: 'Buyurtmalar', href: '/account', icon: <Package className="h-4 w-4" aria-hidden /> },
  { label: 'Manzillar', href: '/account/addresses', icon: <MapPin className="h-4 w-4" aria-hidden /> },
  { label: 'Retseptlar', href: '/account/prescriptions', icon: <FileText className="h-4 w-4" aria-hidden /> },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireSession('/account');

  return (
    <DashboardShell title="Mening hisobim" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
