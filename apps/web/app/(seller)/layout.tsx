import { Boxes, LayoutDashboard, Package, Settings, Truck, Wallet } from 'lucide-react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { DashboardShell, type NavItem } from '@/components/domain/dashboard-shell';
import { requireSession } from '@/lib/auth/guards';

const NAV: NavItem[] = [
  { label: 'Umumiy', href: '/seller', icon: LayoutDashboard },
  { label: 'E’lonlar', href: '/seller/listings', icon: Package },
  { label: 'Ombor', href: '/seller/inventory', icon: Boxes },
  { label: 'Buyurtmalar', href: '/seller/orders', icon: Truck },
  { label: 'To’lovlar', href: '/seller/payouts', icon: Wallet },
  { label: 'Hisob', href: '/seller/settings', icon: Settings },
];

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession('/seller');
  // Rolni har bir so‘rovda API tekshiradi; bu yer faqat ma’lumot yuklanmaydigan
  // panelni ko‘rsatmaslik uchun.
  if (session.user.role === 'buyer') redirect('/sell');

  const activePath = headers().get('x-pathname') ?? '/seller';

  return (
    <DashboardShell title="Sotuvchi" nav={NAV} activePath={activePath}>
      {children}
    </DashboardShell>
  );
}
