'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="border-b border-ink-line">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-display text-xl text-brass-strong tracking-wide">
            Voyage Ledger
          </span>
          <span className="hidden sm:inline text-[11px] uppercase tracking-[0.2em] text-ink-text-muted font-mono-num">
            AI Travel Desk
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="text-ink-text-muted hover:text-ink-text transition">
                Dashboard
              </Link>
              <span className="text-ink-text-muted hidden sm:inline">
                {user.name}
              </span>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="px-3 py-1.5 rounded-md border border-ink-line text-ink-text hover:border-brass hover:text-brass-strong transition"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-ink-text-muted hover:text-ink-text transition">
                Sign in
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 rounded-md bg-brass text-ink font-medium hover:bg-brass-strong transition"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
