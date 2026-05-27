'use client';

import * as React from 'react';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { Progress } from '@/components/ui/progress';
import { useIntersection } from '@/hooks/use-intersection';
import { cn } from '@/lib/utils';

const DIMENSIONS = [
  { label: 'Assessment Score', pct: 88, pctClass: 'dim-pct-cyan', color: 'cyan' as const },
  { label: 'Client Ratings', pct: 92, pctClass: 'dim-pct-green', color: 'green' as const },
  { label: 'Portfolio Depth', pct: 75, pctClass: 'dim-pct-violet', color: 'violet' as const },
  { label: 'Work Delivery', pct: 95, pctClass: 'dim-pct-amber', color: 'amber' as const },
  { label: 'Marketplace', pct: 60, pctClass: 'dim-pct-cyan', color: 'cyan' as const },
  { label: 'Community', pct: 70, pctClass: 'dim-pct-violet', color: 'violet' as const },
];

export function NeuronScoreExplainerSection() {
  const [sectionRef, visible] = useIntersection(0.3);

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="section-neuron-gradient py-24 px-6"
      aria-labelledby="neuron-score-heading"
    >
      <div className="max-w-5xl mx-auto">
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
          <div className="flex flex-col items-center gap-4 shrink-0">
            <NeuronScoreRing score={820} size={160} strokeWidth={8} animate={visible} />
            <div className="text-center">
              <p className="text-text-secondary text-sm">Elite Tier</p>
              <p className="text-text-muted text-xs font-mono mt-1">Top 5% of engineers</p>
            </div>
          </div>

          <div className="flex-1 w-full space-y-5">
            <p className="text-text-secondary text-sm mb-6">
              NeuronScore is a composite of 6 dimensions, updated in real-time as you work, deliver, and grow on the platform.
            </p>
            {DIMENSIONS.map((dim) => (
              <div key={dim.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-text-secondary">{dim.label}</span>
                  <span className={cn('text-xs font-mono', dim.pctClass)}>{dim.pct}%</span>
                </div>
                <Progress
                  value={visible ? dim.pct : 0}
                  max={100}
                  color={dim.color}
                  size="sm"
                  label={dim.label}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
