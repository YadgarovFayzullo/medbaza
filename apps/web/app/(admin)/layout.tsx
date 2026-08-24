import { FileText, LayoutDashboard, Package, ScrollText, Store, Users } from 'lucide-react';
import { headers } from 'next/headers';

import { DashboardShell, type NavItem } from '@/components/domain/dashboard-shell';
import { requireRole } from '@/lib/auth/guards';

const NAV: NavItem[] = [
  { label: 'Umumiy', href: '/admin', icon: LayoutDashboard },
  { label: 'Sotuvchilar', href: '/admin/sellers', icon: Store },
  { label: 'Retseptlar', href: '/admin/prescriptions', icon: FileText },
  { label: 'Buyurtmalar', href: '/admin/orders', icon: Package },
  { label: 'Foydalanuvchilar', href: '/admin/users', icon: Users },
  { label: 'Audit jurnali', href: '/admin/audit', icon: ScrollText },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('admin', '/admin');
  const activePath = headers().get('x-pathname') ?? '/admin';

  return (
    <DashboardShell title="Admin" nav={NAV} activePath={activePath}>
      {children}
    </DashboardShell>
  );
}
