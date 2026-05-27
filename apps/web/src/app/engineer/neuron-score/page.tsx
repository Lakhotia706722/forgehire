'use client';

import * as React from 'react';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { TierBadge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useNeuronScore, useNeuronScoreHistory } from '@/lib/api-hooks';

const DIMENSIONS = [
  { key: 'assessment',     label: 'Assessment',      max: 250, color: 'cyan'   as const, description: 'Based on your latest assessment performance' },
  { key: 'clientRatings',  label: 'Client Ratings',  max: 250, color: 'green'  as const, description: 'Average rating from completed contracts' },
  { key: 'portfolioDepth', label: 'Portfolio Depth', max: 200, color: 'violet' as const, description: 'Projects, skills, and profile completeness' },
  { key: 'workDelivery',   label: 'Work Delivery',   max: 150, color: 'amber'  as const, description: 'On-time delivery and quality scores' },
  { key: 'marketplace',    label: 'Marketplace',     max: 100, color: 'cyan'   as const, description: 'Product sales and community engagement' },
  { key: 'community',      label: 'Community',       max: 50,  color: 'green'  as const, description: 'Forum contributions and mentoring' },
];

export default function NeuronScorePage() {
  const { data: scoreData, isLoading } = useNeuronScore();
  const { data: history } = useNeuronScoreHistory();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 flex items-center gap-8">
            <Skeleton circle className="w-32 h-32" />
            <div className="space-y-3 flex-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const score = scoreData?.score ?? 0;
  const tier = scoreData?.tier ?? 'conditional';
  const breakdown = scoreData?.breakdown ?? { assessment: 0, clientRatings: 0, portfolioDepth: 0, workDelivery: 0, marketplace: 0, community: 0 };
  const scoreHistory = history ?? [];

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">NeuronScore</h1>
          <p className="text-text-secondary text-sm mt-1">Your verified AI engineering reputation score</p>
        </div>

        {/* Score hero */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-8">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <NeuronScoreRing score={score} size={140} strokeWidth={8} animate />
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
                <TierBadge tier={tier} />
              </div>
              <p className="text-5xl font-bold text-text-primary font-mono">{score}</p>
              <p className="text-text-muted text-sm mt-1">out of 1,000</p>
              <p className="text-text-secondary text-sm mt-3 max-w-xs">
                You&apos;re in the top 5% of AI engineers on NeuronHire. Keep delivering quality work to maintain your Elite status.
              </p>
            </div>
          </div>
        </div>

        {/* Dimension breakdown */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-6">Score Breakdown</h2>
          <div className="space-y-5">
            {DIMENSIONS.map(d => ({ ...d, score: (breakdown as any)[d.key] ?? 0 })).map((dim) => (
              <div key={dim.key}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-text-primary">{dim.label}</span>
                    <p className="text-xs text-text-muted mt-0.5">{dim.description}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-text-primary">
                    {dim.score} <span className="text-text-muted font-normal">/ {dim.max}</span>
                  </span>
                </div>
                <Progress value={dim.score} max={dim.max} color={dim.color} size="md" />
              </div>
            ))}
          </div>
        </div>

        {/* Score history */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-6">Score History</h2>
          <div className="relative">
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-[rgba(255,255,255,0.06)]" aria-hidden="true" />
            <div className="space-y-6">
              {scoreHistory.map((entry, i) => (
                <div key={i} className="relative flex gap-5 items-start">
                  <div className="relative z-10 w-6 h-6 rounded-full bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.3)] flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-accent-cyan" />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{entry.reason || entry.date}</p>
                      <p className="text-xs text-text-muted font-mono">{entry.date}</p>
                    </div>
                    <span className="font-mono font-bold text-accent-cyan">{entry.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How to improve */}
        <div className="bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.15)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-4">How to Improve</h2>
          <div className="space-y-3">
            {[
              { action: 'Complete more contracts on time', impact: '+15 pts', impactClass: 'dim-pct-green' },
              { action: 'Publish a product to the marketplace', impact: '+20 pts', impactClass: 'dim-pct-cyan' },
              { action: 'Get 5-star reviews from clients', impact: '+10 pts each', impactClass: 'dim-pct-amber' },
              { action: 'Contribute to community forums', impact: '+5 pts', impactClass: 'dim-pct-violet' },
            ].map((tip) => (
              <div key={tip.action} className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
                <p className="text-sm text-text-secondary">{tip.action}</p>
                <span className={cn('text-xs font-mono font-semibold', tip.impactClass)}>{tip.impact}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
