/** Clear the refresh cookie. The in-memory access token dies with the tab. */
import { NextResponse } from 'next/server';

import { REFRESH_COOKIE } from '@/lib/auth/cookies';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}
