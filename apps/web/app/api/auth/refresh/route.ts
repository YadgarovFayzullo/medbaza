/**
 * Exchange the httpOnly refresh cookie for a fresh access token.
 *
 * Called once when the app mounts, and again whenever an access token is about
 * to expire. Rotating refresh tokens are written straight back to the cookie.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { ApiError, request } from '@/lib/api-client';
import type { Schemas } from '@/lib/api-client';
import { REFRESH_COOKIE, refreshCookieOptions } from '@/lib/auth/cookies';

export async function POST() {
  const token = cookies().get(REFRESH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ user: null, access_token: null }, { status: 200 });
  }

  try {
    const session = await request<Schemas['SessionRead']>('/auth/refresh', {
      method: 'POST',
      body: { refresh_token: token },
      cache: 'no-store',
    });
    const response = NextResponse.json({
      user: session.user,
      access_token: session.tokens.access_token,
      expires_in: session.tokens.expires_in,
    });
    response.cookies.set(REFRESH_COOKIE, session.tokens.refresh_token, refreshCookieOptions);
    return response;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const response = NextResponse.json({ user: null, access_token: null });
      response.cookies.delete(REFRESH_COOKIE);
      return response;
    }
    throw error;
  }
}
