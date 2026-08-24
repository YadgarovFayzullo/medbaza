/**
 * Route guards for Server Components.
 *
 * These are a convenience for rendering — the API enforces authorization on
 * every request regardless of what the UI decides to show (CLAUDE.md §12.2).
 */
import { redirect } from 'next/navigation';

import { getSession, type Session } from './session';

export async function requireSession(returnTo: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return session;
}

export async function requireRole(role: 'buyer' | 'seller' | 'admin', returnTo: string) {
  const session = await requireSession(returnTo);
  if (session.user.role !== role) redirect('/');
  return session;
}
