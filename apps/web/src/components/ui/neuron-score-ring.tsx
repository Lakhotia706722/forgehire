'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { TierName } from './badge';

interface NeuronScoreRingProps {
  score: number;       // 0–1000
  tier?: TierName;
  size?: number;       // px, default 120
  strokeWidth?: number;
  className?: string;
  animate?: boolean;
}

const tierColors: Record<TierName, string> = {
  Elite:        '#F59E0B',
  Professional: '#00D4FF',
  Verified:     '#7B5EA7',
  Conditional:  '#4A5568',
};

function getTier(score: number): TierName {
  if (score >= 800) return 'Elite';
  if (score >= 600) return 'Professional';
  if (score >= 400) return 'Verified';
  return 'Conditional';
}

export function NeuronScoreRing({
  score,
  tier,
  size = 120,
  strokeWidth = 6,
  className,
  animate = true,
}: NeuronScoreRingProps) {
  const resolvedTier = tier ?? getTier(score);
  const color = tierColors[resolvedTier];

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const maxScore = 1000;
  const progress = Math.min(score / maxScore, 1);

  const [displayScore, setDisplayScore] = React.useState(animate ? 0 : score);
  const [strokeDash, setStrokeDash] = React.useState(
    animate ? circumference : circumference * (1 - progress)
  );

  React.useEffect(() => {
    if (!animate) return;

    // Animate stroke
    const strokeTarget = circumference * (1 - progress);
    const startTime = performance.now();
    const duration = 1000;

    const raf = requestAnimationFrame(function tick(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // ease-out-expo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

      setStrokeDash(circumference - eased * (circumference - strokeTarget));
      setDisplayScore(Math.round(eased * score));

      if (t < 1) requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(raf);
  }, [score, circumference, progress, animate]);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-label={`NeuronScore: ${score}`}
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDash}
          style={{
            filter: `drop-shadow(0 0 6px ${color}80)`,
            transition: animate ? 'none' : 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </svg>

      {/* Score number */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-semibold leading-none"
          style={{ color, fontSize: size * 0.22 }}
        >
          {displayScore}
        </span>
        <span
          className="text-text-muted font-mono uppercase tracking-widest"
          style={{ fontSize: size * 0.09 }}
        >
          {resolvedTier}
        </span>
      </div>
    </div>
  );
}
