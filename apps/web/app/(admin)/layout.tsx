import { FileText, LayoutDashboard, Package, ScrollText, Store, Users } from 'lucide-react';

import { DashboardShell, type NavItem } from '@/components/domain/dashboard-shell';
import { requireRole } from '@/lib/auth/guards';

const NAV: NavItem[] = [
  { label: 'Umumiy', href: '/admin', icon: <LayoutDashboard className="h-4 w-4" aria-hidden /> },
  { label: 'Sotuvchilar', href: '/admin/sellers', icon: <Store className="h-4 w-4" aria-hidden /> },
  { label: 'Retseptlar', href: '/admin/prescriptions', icon: <FileText className="h-4 w-4" aria-hidden /> },
  { label: 'Buyurtmalar', href: '/admin/orders', icon: <Package className="h-4 w-4" aria-hidden /> },
  { label: 'Foydalanuvchilar', href: '/admin/users', icon: <Users className="h-4 w-4" aria-hidden /> },
  { label: 'Audit jurnali', href: '/admin/audit', icon: <ScrollText className="h-4 w-4" aria-hidden /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('admin', '/admin');

  return (
    <DashboardShell title="Admin" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
