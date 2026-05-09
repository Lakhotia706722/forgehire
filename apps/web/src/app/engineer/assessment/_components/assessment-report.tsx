'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { TierBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TierName } from '@/components/ui/badge';

// SSR-safe Recharts import
const RadarChart = dynamic(
  () => import('recharts').then((m) => m.RadarChart),
  { ssr: false }
);
const Radar = dynamic(() => import('recharts').then((m) => m.Radar), { ssr: false });
const PolarGrid = dynamic(() => import('recharts').then((m) => m.PolarGrid), { ssr: false });
const PolarAngleAxis = dynamic(() => import('recharts').then((m) => m.PolarAngleAxis), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false });

interface ReportData {
  score: number;
  tier: TierName;
  dimensions: { name: string; value: number; fullMark: number }[];
  strengths: string[];
  gaps: string[];
  mcqScore: number;
  codingScore: number;
  scenarioScore: number;
}

const MOCK_REPORT: ReportData = {
  score: 820,
  tier: 'Elite',
  dimensions: [
    { name: 'Model Knowledge',    value: 88, fullMark: 100 },
    { name: 'Engineering Depth',  value: 92, fullMark: 100 },
    { name: 'System Design',      value: 78, fullMark: 100 },
    { name: 'Code Quality',       value: 85, fullMark: 100 },
    { name: 'Practical App',      value: 90, fullMark: 100 },
    { name: 'Communication',      value: 82, fullMark: 100 },
  ],
  strengths: [
    'Exceptional understanding of transformer architectures and attention mechanisms',
    'Strong practical implementation skills — clean, production-ready code',
    'Excellent RAG pipeline design with proper chunking and retrieval strategies',
  ],
  gaps: [
    'System design at scale (distributed training, multi-region serving)',
    'MLOps practices — monitoring, drift detection, A/B testing frameworks',
  ],
  mcqScore: 87,
  codingScore: 91,
  scenarioScore: 78,
};

interface AssessmentReportProps {
  onConfettiDone?: () => void;
}

export function AssessmentReport({ onConfettiDone }: AssessmentReportProps) {
  const firedRef = React.useRef(false);
  const report = MOCK_REPORT;
  const isPassed = report.tier === 'Elite' || report.tier === 'Professional';

  React.useEffect(() => {
    if (firedRef.current || !isPassed) return;
    firedRef.current = true;
    onConfettiDone?.();

    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.4 }, colors: ['#00D4FF', '#F59E0B', '#7B5EA7', '#10B981'] });
    });
  }, [isPassed, onConfettiDone]);

  return (
    <div className="min-h-screen bg-bg-base py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <p className="text-xs font-mono text-text-muted uppercase tracking-widest">Assessment Complete</p>
          <h1 className="font-display text-4xl font-bold text-text-primary">
            {isPassed ? '🎉 Congratulations!' : 'Assessment Complete'}
          </h1>
        </div>

        {/* Score + tier */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-8">
          <NeuronScoreRing score={report.score} size={140} strokeWidth={8} />
          <div className="flex-1 text-center sm:text-left">
            <TierBadge tier={report.tier} />
            <h2 className="font-display text-3xl font-bold text-text-primary mt-3 mb-2">
              NeuronScore: {report.score}
            </h2>
            <p className="text-text-secondary text-sm">
              You&apos;re in the top {report.tier === 'Elite' ? '5%' : '20%'} of AI engineers on NeuronHire.
            </p>

            {/* Section scores */}
            <div className="flex gap-4 mt-4">
              {[
                { label: 'MCQ',      score: report.mcqScore },
                { label: 'Coding',   score: report.codingScore },
                { label: 'Scenario', score: report.scenarioScore },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-mono font-bold text-lg text-accent-cyan">{s.score}%</p>
                  <p className="text-xs text-text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Radar chart */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h3 className="font-display font-semibold text-text-primary mb-4">Dimension Breakdown</h3>
          <div className="h-64" data-testid="radar-chart">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={report.dimensions}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fill: '#8892A4', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#00D4FF"
                  fill="#00D4FF"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strengths & gaps */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.2)] rounded-xl p-5">
            <h3 className="font-display font-semibold text-accent-green text-sm mb-3">Strengths</h3>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="text-accent-green mt-0.5" aria-hidden="true">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.2)] rounded-xl p-5">
            <h3 className="font-display font-semibold text-accent-amber text-sm mb-3">Areas to Improve</h3>
            <ul className="space-y-2">
              {report.gaps.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="text-accent-amber mt-0.5" aria-hidden="true">→</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-3">
          <Link href="/engineer/dashboard">
            <Button size="lg" className="min-w-[240px]">
              Go to Dashboard →
            </Button>
          </Link>
          <p className="text-xs text-text-muted">
            Your profile is now live and visible to companies
          </p>
        </div>
      </div>
    </div>
  );
}
