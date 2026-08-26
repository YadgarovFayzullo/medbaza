import { Boxes, LayoutDashboard, Package, Settings, Truck, Wallet } from 'lucide-react';
import { redirect } from 'next/navigation';

import { DashboardShell, type NavItem } from '@/components/domain/dashboard-shell';
import { requireSession } from '@/lib/auth/guards';

const NAV: NavItem[] = [
  { label: 'Umumiy', href: '/seller', icon: <LayoutDashboard className="h-4 w-4" aria-hidden /> },
  { label: 'E’lonlar', href: '/seller/listings', icon: <Package className="h-4 w-4" aria-hidden /> },
  { label: 'Ombor', href: '/seller/inventory', icon: <Boxes className="h-4 w-4" aria-hidden /> },
  { label: 'Buyurtmalar', href: '/seller/orders', icon: <Truck className="h-4 w-4" aria-hidden /> },
  { label: 'To’lovlar', href: '/seller/payouts', icon: <Wallet className="h-4 w-4" aria-hidden /> },
  { label: 'Hisob', href: '/seller/settings', icon: <Settings className="h-4 w-4" aria-hidden /> },
];

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession('/seller');
  // Rolni har bir so‘rovda API tekshiradi; bu yer faqat ma’lumot yuklanmaydigan
  // panelni ko‘rsatmaslik uchun.
  if (session.user.role === 'buyer') redirect('/sell');

  return (
    <DashboardShell title="Sotuvchi" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
