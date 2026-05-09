import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="font-mono text-8xl font-bold text-[rgba(0,212,255,0.15)] mb-4 select-none" aria-hidden="true">
          404
        </p>
        <h1 className="font-display text-2xl font-bold text-text-primary mb-3">
          Page not found
        </h1>
        <p className="text-text-secondary text-sm leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-accent-cyan text-bg-base font-semibold text-sm hover:brightness-110 transition-all"
          >
            Go Home
          </Link>
          <Link
            href="/engineer/dashboard"
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-[rgba(0,212,255,0.3)] text-accent-cyan text-sm hover:bg-[rgba(0,212,255,0.05)] transition-all"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
