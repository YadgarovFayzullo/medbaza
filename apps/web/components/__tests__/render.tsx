import { render as baseRender } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

import { Providers } from '@/app/providers';

/**
 * Renders a component inside the app's real provider tree, with the network
 * stubbed. Cards and other leaves read the cart through context, so a bare
 * `render` would throw.
 */
export function renderWithProviders(ui: ReactElement) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      // Signed out, empty cart — the default state a storefront card renders in.
      const body = url.includes('/auth/refresh')
        ? { user: null, access_token: null }
        : {
            id: 'cart-1',
            currency: 'UZS',
            groups: [],
            item_count: 0,
            items_amount_minor: 0,
            shipping_amount_minor: 0,
            total_amount_minor: 0,
            prescription_required: false,
            warnings: [],
          };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );

  const result = baseRender(<Providers>{ui}</Providers>);
  return {
    ...result,
    // `rerender` replaces the root, so it has to re-wrap or the providers vanish.
    rerender: (next: ReactElement) => result.rerender(<Providers>{next}</Providers>),
  };
}
