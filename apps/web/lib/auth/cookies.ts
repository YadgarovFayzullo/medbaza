/**
 * Refresh-token cookie handling.
 *
 * The refresh token lives in an httpOnly cookie and the access token lives only
 * in memory — neither ever touches `localStorage` (CLAUDE.md §3.8).
 */
export const REFRESH_COOKIE = 'medbaza_refresh';
export const CART_COOKIE = 'medbaza_cart';

export const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  // Matches JWT_REFRESH_TTL on the API.
  maxAge: 60 * 60 * 24 * 14,
};

// Readable by the browser on purpose: it is an opaque basket id, not a
// credential, and the client sends it as `X-Cart-Token`.
export const cartCookieOptions = {
  httpOnly: false,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};
