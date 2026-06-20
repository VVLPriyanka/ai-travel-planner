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
        <div className="glass w-full max-w-sm p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-text-faint mb-1">Welcome back</p>
          <h1 className="font-display text-2xl font-semibold text-text mb-6">Sign in</h1>

          <form onSubmit={handleSubmit}>
            {error && (
              <p className="mb-4 text-sm text-bad bg-bad/10 border border-bad/30 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <label className="block text-xs uppercase tracking-wide text-text-faint mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input w-full mb-4 px-4 py-2.5 outline-none"
              placeholder="you@example.com"
            />

            <label className="block text-xs uppercase tracking-wide text-text-faint mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full mb-6 px-4 py-2.5 outline-none"
              placeholder="••••••••"
            />

            <button type="submit" disabled={submitting} className="btn-pill btn-pill-primary w-full disabled:opacity-60">
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-sm text-text-muted mt-5 text-center">
              New here?{' '}
              <Link href="/register" className="text-accent-strong hover:underline">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
