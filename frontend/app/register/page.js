'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register, user, ready } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
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
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setSubmitting(true);
    try {
      await register(name, email, password);
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
              First time here
            </p>
            <h1 className="font-display text-2xl mb-6">Create your account</h1>

            {error && (
              <p className="mb-4 text-sm text-airmail-red bg-airmail-red/10 border border-airmail-red/30 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <label className="block text-xs uppercase tracking-wide text-paper-text-muted mb-1" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded-md border border-paper-line bg-white/40 text-paper-text focus:outline-none focus:border-airmail-blue"
              placeholder="Jordan Avery"
            />

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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-1 px-3 py-2 rounded-md border border-paper-line bg-white/40 text-paper-text focus:outline-none focus:border-airmail-blue"
              placeholder="At least 6 characters"
            />
            <p className="text-xs text-paper-text-muted mb-6">Minimum 6 characters.</p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-md bg-ink text-paper font-medium hover:bg-ink-raised transition disabled:opacity-60"
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </button>

            <p className="text-sm text-paper-text-muted mt-5 text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-airmail-blue hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
