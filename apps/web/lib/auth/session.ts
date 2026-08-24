/**
 * Server-side session.
 *
 * A Server Component cannot hold an access token, so it exchanges the httpOnly
 * refresh cookie for a short-lived one per render. `cache()` keeps that to a
 * single exchange per request.
 */
import { cache } from 'react';
import { cookies } from 'next/headers';

import { ApiError, request } from '@/lib/api-client';
import type { Schemas } from '@/lib/api-client';
import { REFRESH_COOKIE } from './cookies';

export type User = Schemas['UserRead'];

export interface Session {
  user: User;
  accessToken: string;
}

export const getSession = cache(async (): Promise<Session | null> => {
  const token = cookies().get(REFRESH_COOKIE)?.value;
  if (!token) return null;

  try {
    const session = await request<Schemas['SessionRead']>('/auth/refresh', {
      method: 'POST',
      body: { refresh_token: token },
      cache: 'no-store',
    });
    return { user: session.user, accessToken: session.tokens.access_token };
  } catch (error) {
    // An expired or revoked refresh token simply means "signed out".
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

/** Session or nothing — for pages that render differently when signed in. */
export async function getOptionalSession(): Promise<Session | null> {
  return getSession();
}
