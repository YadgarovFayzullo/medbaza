import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders as render } from '@/components/__tests__/render';

import { ProductCard } from '@/components/domain/product-card';
import type { ProductListItem } from '@/lib/api-client/endpoints';

function makeProduct(overrides: Partial<ProductListItem> = {}): ProductListItem {
  return {
    id: 'p1',
    name: 'Infrared thermometer',
    slug: 'infrared-thermometer',
    brand: 'Carevale',
    image_url: null,
    price_amount_minor: 399_000,
    compare_at_amount_minor: 499_000,
    discount_percent: 20,
    currency: 'UZS',
    unit_label: 'dona',
    in_stock: true,
    stock: 12,
    certifications: ['CE', 'FDA'],
    prescription_required: false,
    rating_average: 4.5,
    rating_count: 8,
    category_id: 'c1',
    seller: {
      id: 's1',
      business_name: 'Carevale Diagnostics',
      slug: 'carevale-diagnostics',
      country: 'DE',
      status: 'verified',
      verified: true,
    },
    ...overrides,
  };
}

describe('ProductCard', () => {
  it('shows the price formatted from minor units', () => {
    render(<ProductCard product={makeProduct()} />);
    // Grouped and undecimated: so'm has no minor unit. `\s` rather than a
    // literal NBSP because testing-library normalises whitespace first.
    expect(screen.getByText(/399\s000/)).toBeInTheDocument();
  });

  it('shows the was-price and the derived saving when a listing is discounted', () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.getByText(/499\s000/)).toBeInTheDocument();
    expect(screen.getByText('−20%')).toBeInTheDocument();
  });

  it('shows no was-price when the listing is not discounted', () => {
    render(
      <ProductCard
        product={makeProduct({ compare_at_amount_minor: null, discount_percent: null })}
      />,
    );
    expect(screen.queryByText(/−\d+%/)).not.toBeInTheDocument();
  });

  it('shows the verified-seller badge only for verified sellers', () => {
    const { rerender } = render(<ProductCard product={makeProduct()} />);
    expect(screen.getByText('Tasdiqlangan')).toBeInTheDocument();

    rerender(
      <ProductCard
        product={makeProduct({
          seller: { ...makeProduct().seller, verified: false, status: 'pending' },
        })}
      />,
    );
    expect(screen.queryByText('Tasdiqlangan')).not.toBeInTheDocument();
  });

  it('lists the certifications the listing carries', () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.getByText('CE · FDA')).toBeInTheDocument();
  });

  it('flags prescription-only items', () => {
    render(<ProductCard product={makeProduct({ prescription_required: true })} />);
    expect(screen.getByText('Retsept')).toBeInTheDocument();
  });

  it('replaces the buy control with a sold-out notice when there is no stock', () => {
    render(<ProductCard product={makeProduct({ stock: 0, in_stock: false })} />);
    expect(screen.getByText('Mavjud emas')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /savatga/i })).not.toBeInTheDocument();
  });
});
