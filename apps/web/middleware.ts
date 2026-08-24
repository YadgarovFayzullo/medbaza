import { NextResponse, type NextRequest } from 'next/server';

/**
 * Publishes the current path as a header so a layout can mark the active nav
 * item without turning the whole rail into a Client Component.
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set('x-pathname', request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
