'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import {
  MOCK_ANALYTICS_OVERVIEW,
  MOCK_PROFILE_VIEWS,
  MOCK_SEARCH_KEYWORDS,
  MOCK_SKILL_DEMAND,
  MOCK_NEURON_SCORE_HISTORY,
  formatTrend,
  type SearchKeyword,
} from '@/lib/payments-analytics-data';

export default function EngineerAnalyticsPage() {
  const overview = MOCK_ANALYTICS_OVERVIEW;

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
            <div className="mt-2 h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-cyan rounded-full transition-all duration-700"
                style={{ width: `${overview.proposalAcceptanceRate}%` }}
              />
            </div>
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
                <LineChart data={MOCK_NEURON_SCORE_HISTORY}>
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
            <LineChart data={MOCK_PROFILE_VIEWS}>
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
              {MOCK_PROFILE_VIEWS.filter((d) => d.event).map((d) => (
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
                {MOCK_SEARCH_KEYWORDS.map((kw) => (
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
            <BarChart data={MOCK_SKILL_DEMAND} layout="vertical">
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
            <LineChart data={MOCK_NEURON_SCORE_HISTORY}>
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
