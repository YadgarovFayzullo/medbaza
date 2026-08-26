import { render, screen } from '@testing-library/react';
import { Boxes, LayoutDashboard, Package } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { NavLinks, type NavItem } from '@/components/domain/nav-links';

const pathname = vi.hoisted(() => ({ current: '/seller' }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }));

const NAV: NavItem[] = [
  { label: 'Umumiy', href: '/seller', icon: <LayoutDashboard /> },
  { label: 'E’lonlar', href: '/seller/listings', icon: <Package /> },
  { label: 'Ombor', href: '/seller/inventory', icon: <Boxes /> },
];

function markedAt(path: string) {
  pathname.current = path;
  const { unmount } = render(<NavLinks nav={NAV} label="Sotuvchi" />);
  const marked = screen
    .getAllByRole('link')
    .filter((link) => link.getAttribute('aria-current') === 'page')
    .map((link) => link.textContent);
  unmount();
  return marked;
}

describe('NavLinks active marking', () => {
  it('marks the index item on the index path', () => {
    expect(markedAt('/seller')).toEqual(['Umumiy']);
  });

  it('marks only the most specific item on a nested path', () => {
    // The index href '/seller' prefixes every sibling, so a plain prefix test
    // would light up 'Umumiy' alongside 'E’lonlar' here.
    expect(markedAt('/seller/listings')).toEqual(['E’lonlar']);
  });

  it('keeps the section marked on a detail route', () => {
    expect(markedAt('/seller/listings/01a0329f-85cd-7a96-a55b-881aed0a6e54')).toEqual(['E’lonlar']);
  });

  it('follows the router instead of trailing a navigation behind', () => {
    // The regression this component exists for: a layout is not re-rendered
    // between sibling pages, so a server-read path stayed on the previous page.
    expect(markedAt('/seller/listings')).toEqual(['E’lonlar']);
    expect(markedAt('/seller/inventory')).toEqual(['Ombor']);
  });

  it('marks nothing for a path outside the rail', () => {
    expect(markedAt('/seller-elsewhere')).toEqual([]);
  });
});
