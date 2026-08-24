'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Alert, Button, Card, Checkbox, Input } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn, register } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [asSeller, setAsSeller] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = params.get('next') ?? '/';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await register({
          email,
          password,
          full_name: fullName,
          role: asSeller ? 'seller' : 'buyer',
        });
      }
      router.push(asSeller ? '/sell' : next);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nimadir noto’g’ri ketdi.');
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-8">
      <h1 className="text-2xl">{mode === 'login' ? 'Kirish' : 'Hisob yaratish'}</h1>
      <p className="mt-2 text-sm text-accent/60">
        {mode === 'login'
          ? 'Kirganingizda savatingiz siz bilan qoladi.'
          : 'Xaridor va sotuvchi bitta hisobdan foydalanadi. Sotuvchilar e’lon berishdan oldin tekshiriladi.'}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {error ? (
          <Alert tone="warning" title="Davom eta olmadik">
            {error}
          </Alert>
        ) : null}

        {mode === 'register' ? (
          <Input
            label="To’liq ism"
            required
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        ) : null}

        <Input
          label="Elektron pochta"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Input
          label="Parol"
          type="password"
          required
          minLength={mode === 'register' ? 10 : undefined}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint={mode === 'register' ? 'Kamida 10 ta belgi.' : undefined}
        />

        {mode === 'register' ? (
          <Checkbox
            label="MedBaza’da sotmoqchiman"
            checked={asSeller}
            onChange={(event) => setAsSeller(event.target.checked)}
          />
        ) : null}

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          {mode === 'login' ? 'Kirish' : 'Hisob yaratish'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-accent/60">
        {mode === 'login' ? (
          <>
            Yangi foydalanuvchimisiz?{' '}
            <Link href="/register" className="font-medium text-primary-ink hover:underline">
              Hisob yarating
            </Link>
          </>
        ) : (
          <>
            Ro’yxatdan o’tganmisiz?{' '}
            <Link href="/login" className="font-medium text-primary-ink hover:underline">
              Kirish
            </Link>
          </>
        )}
      </p>
    </Card>
  );
}
