/**
 * Sign in, then hand the refresh token to an httpOnly cookie.
 *
 * The browser only ever receives the short-lived access token, which the client
 * keeps in memory (CLAUDE.md §3.8).
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { ApiError, request } from '@/lib/api-client';
import type { Schemas } from '@/lib/api-client';
import { CART_COOKIE, REFRESH_COOKIE, refreshCookieOptions } from '@/lib/auth/cookies';

export async function POST(incoming: Request) {
  const body = (await incoming.json()) as Schemas['LoginRequest'];
  const cartToken = cookies().get(CART_COOKIE)?.value;

  try {
    const session = await request<Schemas['SessionRead']>('/auth/login', {
      method: 'POST',
      body,
      // Merges any guest cart into the account being signed in to.
      headers: cartToken ? { 'X-Cart-Token': cartToken } : {},
      cache: 'no-store',
    });

    const response = NextResponse.json({
      user: session.user,
      access_token: session.tokens.access_token,
      expires_in: session.tokens.expires_in,
    });
    response.cookies.set(REFRESH_COOKIE, session.tokens.refresh_token, refreshCookieOptions);
    response.cookies.delete(CART_COOKIE);
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: error.status },
      );
    }
    throw error;
  }
}
