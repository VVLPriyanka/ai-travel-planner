'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login, user, ready } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && user) router.push('/dashboard');
  }, [ready, user, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="ticket w-full max-w-sm overflow-hidden">
          <div className="ticket-stripe" />
          <form onSubmit={handleSubmit} className="p-7">
            <p className="text-[11px] uppercase tracking-[0.2em] text-paper-text-muted mb-1">
              Welcome back
            </p>
            <h1 className="font-display text-2xl mb-6">Sign in</h1>

            {error && (
              <p className="mb-4 text-sm text-airmail-red bg-airmail-red/10 border border-airmail-red/30 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <label className="block text-xs uppercase tracking-wide text-paper-text-muted mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded-md border border-paper-line bg-white/40 text-paper-text focus:outline-none focus:border-airmail-blue"
              placeholder="you@example.com"
            />

            <label className="block text-xs uppercase tracking-wide text-paper-text-muted mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-6 px-3 py-2 rounded-md border border-paper-line bg-white/40 text-paper-text focus:outline-none focus:border-airmail-blue"
              placeholder="••••••••"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-md bg-ink text-paper font-medium hover:bg-ink-raised transition disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-sm text-paper-text-muted mt-5 text-center">
              New here?{' '}
              <Link href="/register" className="text-airmail-blue hover:underline">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
