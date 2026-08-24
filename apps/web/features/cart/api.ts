/**
 * Cart transport.
 *
 * A guest cart is identified by an opaque token the API mints and returns in
 * `X-Cart-Token`; it is kept in a cookie so the same basket survives a reload
 * and can be merged into an account at sign-in.
 */
import { ApiError, requestWithHeaders as baseRequest, type RequestOptions } from '@/lib/api-client';
import type { Cart } from '@/lib/api-client/endpoints';
import { CART_COOKIE } from '@/lib/auth/cookies';

export { ApiError };
export type { Cart };

const CART_HEADER = 'X-Cart-Token';

function readToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CART_COOKIE}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function writeToken(token: string): void {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CART_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${secure}`;
}

export async function requestWithHeaders<T>(path: string, options: RequestOptions = {}) {
  const token = readToken();
  const response = await baseRequest<T>(path, {
    ...options,
    cache: 'no-store',
    headers: { ...options.headers, ...(token ? { [CART_HEADER]: token } : {}) },
  });
  const issued = response.headers.get(CART_HEADER);
  if (issued && issued !== token) writeToken(issued);
  return response;
}
