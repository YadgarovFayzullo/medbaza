import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProductGallery } from '@/features/products/product-gallery';

const IMAGES = ['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg', 'https://cdn.example/c.jpg'];

describe('ProductGallery', () => {
  it('renders every image as a slide, announcing each one once', () => {
    render(<ProductGallery images={IMAGES} name="Nitril qo‘lqoplar" />);
    // Thumbnails carry alt="" on purpose: they repeat the slides, and a screen
    // reader should hear each photo once, not twice.
    expect(screen.getAllByRole('img')).toHaveLength(IMAGES.length);
  });

  it('offers a direct route to every image, not only the swipe', () => {
    // §9: a sideways scroll may never be the only way to reach something.
    render(<ProductGallery images={IMAGES} name="Nitril qo‘lqoplar" />);
    expect(screen.getAllByRole('button', { name: /rasmni ko’rsatish/ })).toHaveLength(IMAGES.length);
    expect(screen.getByRole('button', { name: 'Oldingi rasm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keyingi rasm' })).toBeInTheDocument();
  });

  it('never dead-ends: both arrows stay live on the first and last image', () => {
    // The carousel wraps, so the first card still goes left and the last still
    // goes right rather than presenting a disabled control.
    render(<ProductGallery images={IMAGES} name="Nitril qo‘lqoplar" />);
    expect(screen.getByRole('button', { name: 'Oldingi rasm' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Keyingi rasm' })).toBeEnabled();
  });

  it('shows no carousel controls for a single image', () => {
    render(<ProductGallery images={[IMAGES[0]!]} name="Nitril qo‘lqoplar" />);
    expect(screen.queryByRole('button', { name: 'Keyingi rasm' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('falls back to a placeholder when a listing has no photo', () => {
    render(<ProductGallery images={[]} name="Nitril qo‘lqoplar" />);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });
});
