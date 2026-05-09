import * as React from 'react';
import { ParticleField } from '@/components/ui/particle-field';
import { AnimatedTagline } from './_components/animated-tagline';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-bg-base">
      {/* ── Left: Form area ─────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12 relative z-10">
        {/* Logo */}
        <div className="absolute top-8 left-8 lg:left-12">
          <a href="/" className="flex items-center gap-2 group" aria-label="NeuronHire home">
            <div className="w-8 h-8 rounded-lg bg-accent-cyan flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z"
                  stroke="#080B14"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <circle cx="8" cy="8" r="2" fill="#080B14" />
              </svg>
            </div>
            <span className="font-display font-bold text-text-primary text-lg tracking-tight">
              NeuronHire
            </span>
          </a>
        </div>

        {/* Form content */}
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* ── Right: Visual panel (hidden on mobile) ──────── */}
      <div className="hidden lg:flex w-[45%] relative overflow-hidden bg-bg-surface border-l border-[rgba(255,255,255,0.04)]">
        {/* Particle canvas */}
        <ParticleField className="absolute inset-0" />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 30% 50%, rgba(0,212,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(123,94,167,0.08) 0%, transparent 60%)',
          }}
        />

        {/* Tagline */}
        <div className="relative z-10 flex flex-col justify-end p-16 pb-20">
          <AnimatedTagline />
          <p className="mt-4 text-text-secondary text-sm max-w-xs leading-relaxed">
            India&apos;s only AI-exclusive talent marketplace. Verified engineers, real projects, transparent payments.
          </p>
        </div>

        {/* Bottom grid decoration */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>
    </div>
  );
}
