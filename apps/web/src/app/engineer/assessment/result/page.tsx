'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { apiFetch } from '@/lib/api-fetch';
import { Button } from '@/components/ui/button';

const RadarChart = dynamic(() => import('recharts').then((m) => m.RadarChart), { ssr: false });
const Radar = dynamic(() => import('recharts').then((m) => m.Radar), { ssr: false });
const PolarGrid = dynamic(() => import('recharts').then((m) => m.PolarGrid), { ssr: false });
const PolarAngleAxis = dynamic(() => import('recharts').then((m) => m.PolarAngleAxis), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false });

type ReportResponse = {
  ready: boolean;
  status?: string;
  overallScore?: number | null;
  tier?: string | null;
  dimensions?: Record<string, number | null>;
  reportUrl?: string | null;
  skillGapAnalysis?: unknown;
  improvementRoadmap?: unknown;
  message?: string;
};

function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((x) => String(x));
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x));
    } catch {
      return [value];
    }
  }
  return [];
}

export default function AssessmentResultPage() {
  const params = useSearchParams();
  const assessmentId = params.get('id');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['assessment-report', assessmentId],
    queryFn: () => apiFetch<ReportResponse>(`/api/assessment/${assessmentId}/report`),
    enabled: Boolean(assessmentId),
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return 10_000;
      return d.ready ? false : 10_000;
    },
    staleTime: 5_000,
    retry: 2,
  });

  if (!assessmentId) {
    return (
      <main className="min-h-screen bg-bg-base text-text-primary p-6">
        <p>Missing assessment id.</p>
        <Link href="/engineer/assessment"><Button className="mt-4">Back to Assessment</Button></Link>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-bg-base text-text-primary p-6">
        <p className="text-sm text-text-secondary">Loading assessment result...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-bg-base text-text-primary p-6">
        <p className="text-sm text-accent-red">Failed to load report.</p>
        <Button className="mt-3" onClick={() => refetch()}>Retry</Button>
      </main>
    );
  }

  if (!data?.ready) {
    return (
      <main className="min-h-screen bg-bg-base text-text-primary p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Assessment submitted</h1>
        <p className="text-sm text-text-secondary">
          Full report generating... (polling every 10s)
        </p>
        <p className="text-xs text-text-muted">Status: {data?.status ?? 'processing'}</p>
      </main>
    );
  }

  const dimensions = Object.entries(data.dimensions ?? {}).map(([name, value]) => ({
    name,
    value: Number(value ?? 0),
    fullMark: 100,
  }));
  const strengths = toList(data.skillGapAnalysis).slice(0, 3);
  const gaps = toList(data.improvementRoadmap).slice(0, 3);

  return (
    <main className="min-h-screen bg-bg-base text-text-primary p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Score: {data.overallScore ?? 0}</h1>
        <p className="text-sm text-text-secondary mt-1">Tier: {data.tier ?? 'pending'}</p>
      </div>

      <section className="h-64 border border-[rgba(255,255,255,0.08)] rounded-xl p-3">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={dimensions}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis dataKey="name" tick={{ fill: '#8892A4', fontSize: 11 }} />
            <Radar dataKey="value" stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.2} />
          </RadarChart>
        </ResponsiveContainer>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.06)] p-4">
          <h2 className="font-semibold mb-2">Strengths</h2>
          <ul className="text-sm text-text-secondary space-y-1">
            {strengths.length ? strengths.map((s) => <li key={s}>- {s}</li>) : <li>- Generated in report PDF</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.06)] p-4">
          <h2 className="font-semibold mb-2">Gaps</h2>
          <ul className="text-sm text-text-secondary space-y-1">
            {gaps.length ? gaps.map((g) => <li key={g}>- {g}</li>) : <li>- Generated in report PDF</li>}
          </ul>
        </div>
      </section>

      <div className="flex gap-3">
        {data.reportUrl ? (
          <a href={data.reportUrl} target="_blank" rel="noreferrer">
            <Button>Download Report PDF</Button>
          </a>
        ) : null}
        <Link href="/engineer/bounties">
          <Button variant="secondary">Explore Bounties</Button>
        </Link>
      </div>
    </main>
  );
}

