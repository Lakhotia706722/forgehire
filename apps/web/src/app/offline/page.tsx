'use client';

/**
 * Offline fallback page — shown by the service worker when the user
 * is offline and the requested page is not in the cache.
 */
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Animated disconnected illustration (CSS only) */}
        <div className="relative w-32 h-32 mx-auto mb-8" aria-hidden="true">
          {/* Outer ring — pulsing slowly */}
          <div className="absolute inset-0 rounded-full border-2 border-[rgba(255,255,255,0.06)] animate-[pulse_3s_ease-in-out_infinite]" />
          {/* Middle ring */}
          <div className="absolute inset-3 rounded-full border border-[rgba(255,255,255,0.04)] animate-[pulse_3s_ease-in-out_infinite_0.5s]" />
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-bg-elevated border border-[rgba(255,255,255,0.08)] flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* WiFi off icon */}
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <circle cx="12" cy="20" r="1" fill="rgba(255,255,255,0.3)" />
              </svg>
            </div>
          </div>
          {/* Broken signal dots */}
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <div
              key={deg}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${deg}deg) translateX(52px) translateY(-50%)`,
                backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
              }}
            />
          ))}
        </div>

        <h1 className="font-display text-2xl font-bold text-text-primary mb-3">
          You&apos;re offline
        </h1>
        <p className="text-text-secondary text-sm leading-relaxed mb-8">
          Check your connection and try again. Some pages you&apos;ve visited recently may still be available.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-6 rounded-xl bg-accent-cyan text-bg-base font-semibold text-sm hover:brightness-110 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
          >
            Try Again
          </button>
          <a
            href="/"
            className="block w-full py-3 px-6 rounded-xl border border-[rgba(255,255,255,0.08)] text-text-secondary text-sm text-center hover:text-text-primary hover:border-[rgba(255,255,255,0.15)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
          >
            Go to Home
          </a>
        </div>

        <p className="mt-8 text-xs text-text-muted">
          NeuronHire works best with a stable internet connection.
        </p>
      </div>
    </div>
  );
}
