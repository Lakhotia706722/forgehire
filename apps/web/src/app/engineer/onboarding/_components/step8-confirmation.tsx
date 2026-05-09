'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';

interface Step8Props {
  onSaveLater: () => void;
}

export function Step8Confirmation({ onSaveLater }: Step8Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const firedRef = React.useRef(false);

  // Fire confetti once on mount
  React.useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#00D4FF', '#7B5EA7', '#F59E0B', '#10B981', '#F0F4FF'],
      });
      // Second burst
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#00D4FF', '#7B5EA7'],
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#F59E0B', '#10B981'],
        });
      }, 300);
    });
  }, []);

  return (
    <div className="text-center space-y-8 py-8">
      {/* Hidden canvas for confetti */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Animated ring */}
      <div className="flex justify-center">
        <div className="relative">
          <NeuronScoreRing score={0} size={120} strokeWidth={6} animate={false} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl" aria-hidden="true">🎉</span>
          </div>
        </div>
      </div>

      {/* Headline */}
      <div>
        <h2 className="font-display text-3xl font-bold text-text-primary mb-3">
          Your profile is ready!
        </h2>
        <p className="text-text-secondary text-base max-w-sm mx-auto leading-relaxed">
          Now take the NeuronScore Assessment to get verified and unlock your tier badge.
          It takes 90 minutes and you can only take it once.
        </p>
      </div>

      {/* Assessment info */}
      <div className="bg-bg-surface border border-[rgba(0,212,255,0.15)] rounded-xl p-5 text-left space-y-3">
        <h3 className="font-display font-semibold text-text-primary text-sm">What to expect:</h3>
        {[
          { icon: '⏱', text: '90 minutes total — MCQ, Coding, and Scenario sections' },
          { icon: '🔒', text: 'Proctored — tab switches and copy-paste are monitored' },
          { icon: '🏆', text: 'Earn your tier: Elite / Professional / Verified / Conditional' },
          { icon: '📊', text: 'Get a detailed report with strengths and improvement areas' },
        ].map((item) => (
          <div key={item.text} className="flex items-start gap-3">
            <span className="text-base shrink-0" aria-hidden="true">{item.icon}</span>
            <p className="text-sm text-text-secondary">{item.text}</p>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <Link href="/engineer/assessment" className="block">
          <Button size="lg" className="w-full">
            Take Assessment Now →
          </Button>
        </Link>
        <button
          onClick={onSaveLater}
          className="w-full text-sm text-text-muted hover:text-text-secondary transition-colors py-2"
        >
          Save and complete assessment later
        </button>
      </div>
    </div>
  );
}
