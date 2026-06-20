'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 pt-4">
      <div className="max-w-6xl mx-auto glass-strong rounded-full px-5 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent-strong to-rose text-[#241015] text-sm font-bold">
            V
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-text">
            Voyage
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="btn-pill btn-pill-ghost !px-3">
                Dashboard
              </Link>
              <span className="hidden sm:inline text-text-muted px-2">{user.name}</span>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="btn-pill btn-pill-glass"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-pill btn-pill-ghost">
                Sign in
              </Link>
              <Link href="/register" className="btn-pill btn-pill-primary">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
