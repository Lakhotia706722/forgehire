'use client';

import * as React from 'react';
import { useIntersection } from '@/hooks/use-intersection';

interface TrustScoreArcProps {
  score: number; // 0–100
}

/**
 * Speedometer-style arc (180° sweep, bottom half).
 * Animates from 0 to score on mount.
 */
export function TrustScoreArc({ score }: TrustScoreArcProps) {
  const [ref, visible] = useIntersection(0.3);
  const [displayScore, setDisplayScore] = React.useState(0);
  const [animated, setAnimated] = React.useState(false);

  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2 + 10; // shift center down so arc is in top half

  // Arc spans 200° (from 190° to 350° in SVG coords, i.e. bottom-left to bottom-right)
  const startAngle = -200; // degrees from 3 o'clock
  const sweepAngle = 200;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (sweepAngle / 360) * circumference;

  function polarToCartesian(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  const start = polarToCartesian(startAngle);
  const end   = polarToCartesian(startAngle + sweepAngle);
  const trackPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 1 1 ${end.x} ${end.y}`;

  const fillRatio = Math.min(score / 100, 1);
  const fillLength = fillRatio * arcLength;
  const dashOffset = arcLength - fillLength;

  // Animate on intersection
  React.useEffect(() => {
    if (!visible || animated) return;
    setAnimated(true);
    const startTime = performance.now();
    const duration = 1200;

    const raf = requestAnimationFrame(function tick(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplayScore(Math.round(eased * score));
      if (t < 1) requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(raf);
  }, [visible, animated, score]);

  // Color based on score
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#00D4FF' : score >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="flex flex-col items-center"
      aria-label={`Trust score: ${score} out of 100`}
    >
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`} aria-hidden="true">
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={trackPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={animated ? dashOffset : arcLength}
          style={{
            transition: animated ? 'none' : undefined,
            filter: `drop-shadow(0 0 4px ${color}80)`,
          }}
        />
      </svg>

      {/* Score label */}
      <div className="-mt-4 text-center">
        <p className="font-mono font-bold text-2xl leading-none" style={{ color }}>
          {displayScore}
        </p>
        <p className="text-xs text-text-muted mt-0.5">Trust Score</p>
      </div>
    </div>
  );
}
