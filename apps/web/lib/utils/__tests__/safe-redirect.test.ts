import { describe, expect, it } from 'vitest';

import { safeRedirectPath } from '@/lib/utils/safe-redirect';

describe('safeRedirectPath', () => {
  it.each(['/', '/account/orders?x=1', '/checkout', '/seller/listings/42#top'])(
    'accepts same-origin path %s',
    (value) => {
      expect(safeRedirectPath(value)).toBe(value);
    },
  );

  it.each([
    ['absolute URL', 'https://evil'],
    ['protocol-relative', '//evil'],
    ['slash-backslash', '/\\evil'],
    ['double backslash', '\\\\evil'],
    ['javascript scheme', 'javascript:alert(1)'],
    ['data scheme', 'data:text/html,hi'],
    ['relative path without leading slash', 'account'],
    ['tab smuggling', '/\t/evil'],
    ['newline smuggling', '/\n/evil'],
    ['leading space', ' /account'],
    // Same-origin as written, but decodes to `//evil`: rejected on purpose so a
    // decoding proxy or framework layer can never turn it into an off-site hop.
    ['encoded double slash', '/%2F%2Fevil'],
    ['encoded backslash', '/%5Cevil'],
    ['malformed encoding', '/%E0%A4%A'],
  ])('rejects %s', (_label, value) => {
    expect(safeRedirectPath(value)).toBe('/');
  });

  it.each([
    ['empty string', ''],
    ['null', null],
    ['undefined', undefined],
  ])('falls back for %s', (_label, value) => {
    expect(safeRedirectPath(value)).toBe('/');
  });

  it('uses the given fallback', () => {
    expect(safeRedirectPath('https://evil', '/account')).toBe('/account');
    expect(safeRedirectPath(null, '/account')).toBe('/account');
  });
});
