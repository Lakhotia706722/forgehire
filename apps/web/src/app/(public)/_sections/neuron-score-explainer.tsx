'use client';

import * as React from 'react';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { useIntersection } from '@/hooks/use-intersection';

const DIMENSIONS = [
  { label: 'Assessment Score',  pct: 88, color: '#00D4FF' },
  { label: 'Client Ratings',    pct: 92, color: '#10B981' },
  { label: 'Portfolio Depth',   pct: 75, color: '#7B5EA7' },
  { label: 'Work Delivery',     pct: 95, color: '#F59E0B' },
  { label: 'Marketplace',       pct: 60, color: '#00D4FF' },
  { label: 'Community',         pct: 70, color: '#7B5EA7' },
];

export function NeuronScoreExplainerSection() {
  const [sectionRef, visible] = useIntersection(0.3);

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-24 px-6"
      style={{ background: 'linear-gradient(180deg, rgba(123,94,167,0.04) 0%, transparent 100%)' }}
      aria-labelledby="neuron-score-heading"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <div className="text-center mb-12">
          <span className="text-xs font-mono text-accent-violet uppercase tracking-widest">
            The NeuronScore System
          </span>
          <h2 id="neuron-score-heading" className="font-display text-4xl font-bold text-text-primary mt-2">
            Every Engineer Has a Score.
            <br />
            <span className="text-accent-violet">Yours Tells the Whole Story.</span>
          </h2>
        </div>

        <div className="bg-bg-surface border border-[rgba(123,94,167,0.2)] rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
          {/* Left: Ring */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            <NeuronScoreRing score={820} size={160} strokeWidth={8} animate={visible} />
            <div className="text-center">
              <p className="text-text-secondary text-sm">Elite Tier</p>
              <p className="text-text-muted text-xs font-mono mt-1">Top 5% of engineers</p>
            </div>
          </div>

          {/* Right: Dimension bars */}
          <div className="flex-1 w-full space-y-5">
            <p className="text-text-secondary text-sm mb-6">
              NeuronScore is a composite of 6 dimensions, updated in real-time as you work, deliver, and grow on the platform.
            </p>
            {DIMENSIONS.map((dim, i) => (
              <div key={dim.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-text-secondary">{dim.label}</span>
                  <span className="text-xs font-mono" style={{ color: dim.color }}>
                    {dim.pct}%
                  </span>
                </div>
                <div className="dimension-bar">
                  <div
                    className="dimension-bar-fill"
                    style={{
                      '--bar-width': `${dim.pct}%`,
                      background: `linear-gradient(90deg, ${dim.color}80, ${dim.color})`,
                      width: visible ? `${dim.pct}%` : '0%',
                      transition: `width 1s cubic-bezier(0.16,1,0.3,1) ${i * 100}ms`,
                    } as React.CSSProperties}
                    role="progressbar"
                    aria-valuenow={dim.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={dim.label}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
