'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { User } from '@/lib/auth/session';

/**
 * Client-side session.
 *
 * The access token is held in memory only; the refresh token lives in an
 * httpOnly cookie that this code never sees (CLAUDE.md §3.8).
 */
interface SessionValue {
  user: User | null;
  ready: boolean;
  /** Returns a valid access token, refreshing first if the current one is stale. */
  getToken: () => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  signOut: () => Promise<void>;
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: 'buyer' | 'seller';
}

const SessionContext = createContext<SessionValue | null>(null);

interface AuthPayload {
  user: User | null;
  access_token: string | null;
  expires_in?: number;
}

async function post(path: string, body?: unknown): Promise<AuthPayload> {
  const response = await fetch(path, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json()) as AuthPayload & { error?: { message: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Nimadir noto’g’ri ketdi. Qayta urinib ko’ring.');
  }
  return payload;
}

export function SessionProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [ready, setReady] = useState(!initialUser);
  const token = useRef<{ value: string; expiresAt: number } | null>(null);
  const queryClient = useQueryClient();

  const apply = useCallback((payload: AuthPayload) => {
    setUser(payload.user);
    token.current = payload.access_token
      ? {
          value: payload.access_token,
          // Muddat tugashidan bir daqiqa oldin yangilanadi.
          expiresAt: Date.now() + ((payload.expires_in ?? 900) - 60) * 1000,
        }
      : null;
    return payload.user;
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Boshlang‘ich yuklash: kim kirgani haqidagi haqiqat manbasi — cookie.
    post('/api/auth/refresh')
      .then((payload) => {
        if (!cancelled) apply(payload);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [apply]);

  const getToken = useCallback(async () => {
    if (token.current && token.current.expiresAt > Date.now()) return token.current.value;
    try {
      const payload = await post('/api/auth/refresh');
      apply(payload);
      return payload.access_token;
    } catch {
      return null;
    }
  }, [apply]);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      ready,
      getToken,
      signIn: async (email, password) => {
        const payload = await post('/api/auth/login', { email, password });
        const signedIn = apply(payload);
        await queryClient.invalidateQueries();
        if (!signedIn) throw new Error('Kirish amalga oshmadi. Qayta urinib ko’ring.');
        return signedIn;
      },
      register: async (input) => {
        const payload = await post('/api/auth/register', input);
        const created = apply(payload);
        await queryClient.invalidateQueries();
        if (!created) throw new Error('Ro’yxatdan o’tish amalga oshmadi. Qayta urinib ko’ring.');
        return created;
      },
      signOut: async () => {
        await post('/api/auth/logout');
        apply({ user: null, access_token: null });
        await queryClient.invalidateQueries();
      },
    }),
    [user, ready, getToken, apply, queryClient],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}
