'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import {
  formatTrend,
  type SearchKeyword,
} from '@/lib/payments-analytics-data';
import { useEngineerAnalytics, useNeuronScoreHistory } from '@/lib/api-hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export default function EngineerAnalyticsPage() {
  const { data: analytics, isLoading } = useEngineerAnalytics();
  const { data: scoreHistory = [] } = useNeuronScoreHistory();

  const overview = {
    profileViews: analytics?.summary?.totalViews ?? 0,
    profileViewsTrend: 18.5,
    proposalAcceptanceRate: Number(analytics?.summary?.acceptanceRate ?? 0),
    searchAppearances: analytics?.summary?.totalProposals ?? 0,
    searchAppearancesTrend: 0,
    earningsThisMonth: analytics?.summary?.totalEarnings ?? 0,
    earningsTrend: 0,
    avgResponseTime: '2.3 hours',
    neuronScore: scoreHistory.at(-1)?.score ?? 0,
  };

  const profileViews = (analytics?.trends?.profileViews ?? []).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    views: d.value,
    event: undefined as string | undefined,
  }));

  const searchKeywords: SearchKeyword[] = (analytics?.topKeywords ?? []).map((kw) => ({
    keyword: kw.keyword,
    impressions: kw.count,
    clickThroughRate: 10,
  }));

  const skillDemand = (analytics?.topSkills ?? []).map((s) => ({
    skill: s.name,
    jobCount: s.views,
    avgRate: 0,
  }));

  const neuronScoreHistory = scoreHistory.map((p) => ({
    date: new Date(p.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    score: p.score,
    event: p.reason ?? '',
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary mb-1">Analytics</h1>
          <p className="text-text-secondary text-sm">Track your profile performance and market insights</p>
        </div>

        {/* Overview Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Profile Views */}
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-text-muted uppercase tracking-wider">Profile Views</p>
              <div className={cn('flex items-center gap-1 text-xs font-mono', overview.profileViewsTrend >= 0 ? 'text-accent-green' : 'text-accent-red')}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn(overview.profileViewsTrend < 0 && 'rotate-180')}>
                  <path d="M8 12V4M4 8l4-4 4 4"/>
                </svg>
                {formatTrend(overview.profileViewsTrend)}
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-text-primary">{overview.profileViews.toLocaleString()}</p>
            <p className="text-xs text-text-muted mt-1">Last 30 days</p>
          </div>

          {/* Proposal Acceptance Rate */}
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Acceptance Rate</p>
            <p className="font-display text-3xl font-bold text-text-primary">{overview.proposalAcceptanceRate}%</p>
            <Progress value={overview.proposalAcceptanceRate} max={100} size="sm" label="Proposal acceptance rate" className="mt-2" />
          </div>

          {/* Avg Response Time */}
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Avg Response Time</p>
            <p className="font-display text-3xl font-bold text-text-primary">{overview.avgResponseTime}</p>
            <p className="text-xs text-accent-green mt-1">Faster than 78% of engineers</p>
          </div>

          {/* NeuronScore with Sparkline */}
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">NeuronScore</p>
            <p className="font-display text-3xl font-bold text-accent-cyan">{overview.neuronScore}</p>
            <div className="mt-2 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={neuronScoreHistory.length ? neuronScoreHistory : [{ date: '—', score: 0, event: '' }]}>
                  <Line type="monotone" dataKey="score" stroke="#00D4FF" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Profile Views Chart */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-6">Profile Views Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profileViews.length ? profileViews : [{ date: '—', views: 0, event: undefined }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#8892A4" style={{ fontSize: 12 }} />
              <YAxis stroke="#8892A4" style={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141828',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line type="monotone" dataKey="views" stroke="#00D4FF" strokeWidth={2} dot={{ fill: '#00D4FF', r: 4 }} />
              {/* Annotated events */}
              {profileViews.filter((d) => d.event).map((d) => (
                <ReferenceLine
                  key={d.date}
                  x={d.date}
                  stroke="rgba(245,158,11,0.5)"
                  strokeDasharray="3 3"
                  label={{
                    value: d.event,
                    position: 'top',
                    fill: '#F59E0B',
                    fontSize: 10,
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Search Keywords Table */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-4">Top Search Keywords</h2>
          <p className="text-sm text-text-muted mb-4">Searches that showed your profile in the last 30 days</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">Keyword</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-text-muted uppercase">Impressions</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-text-muted uppercase">CTR</th>
                </tr>
              </thead>
              <tbody>
                {(searchKeywords.length ? searchKeywords : [{ keyword: 'No data yet', impressions: 0, clickThroughRate: 0 }]).map((kw) => (
                  <tr key={kw.keyword} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="py-3 px-4 text-text-primary font-medium">{kw.keyword}</td>
                    <td className="py-3 px-4 text-right text-text-secondary font-mono">{kw.impressions}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={cn('font-mono font-semibold', kw.clickThroughRate >= 12 ? 'text-accent-green' : 'text-text-secondary')}>
                        {kw.clickThroughRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Skill Market Demand */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-4">Skill Market Demand</h2>
          <p className="text-sm text-text-muted mb-6">Jobs requiring your skills in the last 30 days</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillDemand.length ? skillDemand : [{ skill: '—', jobCount: 0, avgRate: 0 }]} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="#8892A4" style={{ fontSize: 12 }} />
              <YAxis dataKey="skill" type="category" stroke="#8892A4" style={{ fontSize: 12 }} width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141828',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: any, props: any) => [
                  `${Number(value || 0)} jobs`,
                  `Avg Rate: ₹${Number(props?.payload?.avgRate || 0).toLocaleString('en-IN')}/hr`,
                ]}
              />
              <Bar
                dataKey="jobCount"
                fill="url(#skillGradient)"
                radius={[0, 4, 4, 0]}
              />
              <defs>
                <linearGradient id="skillGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4A5568" />
                  <stop offset="100%" stopColor="#00D4FF" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* NeuronScore History */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-6">NeuronScore History</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={neuronScoreHistory.length ? neuronScoreHistory : [{ date: '—', score: 0, event: '' }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#8892A4" style={{ fontSize: 12 }} />
              <YAxis stroke="#8892A4" style={{ fontSize: 12 }} domain={[600, 1000]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141828',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: any, props: any) => [
                  value,
                  props?.payload?.event || 'Score',
                ]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#00D4FF"
                strokeWidth={3}
                dot={{ fill: '#00D4FF', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
