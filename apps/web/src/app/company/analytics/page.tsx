'use client';

import * as React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const MOCK_ANALYTICS = {
  summary: { totalJobsPosted: 8, totalApplications: 47, totalHires: 5, avgTimeToHire: '12.4', totalSpent: 680000, costPerHire: '136000' },
  hiringTrend: [
    { month: 'Jan', jobs: 1, hires: 0, applications: 5 },
    { month: 'Feb', jobs: 2, hires: 1, applications: 12 },
    { month: 'Mar', jobs: 1, hires: 1, applications: 8 },
    { month: 'Apr', jobs: 2, hires: 2, applications: 14 },
    { month: 'May', jobs: 2, hires: 1, applications: 8 },
  ],
  spendingTrend: [
    { month: 'Jan', amount: 0 },
    { month: 'Feb', amount: 120000 },
    { month: 'Mar', amount: 80000 },
    { month: 'Apr', amount: 280000 },
    { month: 'May', amount: 200000 },
  ],
  topSkills: [
    { skill: 'LangChain', count: 18 },
    { skill: 'PyTorch', count: 14 },
    { skill: 'FastAPI', count: 12 },
    { skill: 'LlamaIndex', count: 9 },
    { skill: 'OpenAI', count: 8 },
  ],
};

export default function CompanyAnalyticsPage() {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { summary, hiringTrend, spendingTrend, topSkills } = MOCK_ANALYTICS;

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">Hiring Analytics</h1>
          <p className="text-text-secondary text-sm mt-1">Track your hiring performance and spend</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Jobs Posted',       value: summary.totalJobsPosted,  color: '#00D4FF' },
            { label: 'Applications',      value: summary.totalApplications, color: '#7B5EA7' },
            { label: 'Hires Made',        value: summary.totalHires,        color: '#10B981' },
            { label: 'Avg Time to Hire',  value: `${summary.avgTimeToHire} days`, color: '#F59E0B' },
            { label: 'Total Spend',       value: `₹${(summary.totalSpent / 1000).toFixed(0)}K`, color: '#EF4444' },
            { label: 'Cost per Hire',     value: `₹${(parseInt(summary.costPerHire) / 1000).toFixed(0)}K`, color: '#8892A4' },
          ].map((stat) => (
            <div key={stat.label} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
              <p className="text-xs text-text-muted mb-2">{stat.label}</p>
              <p className="font-mono font-bold text-2xl" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Hiring trend */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-6">Hiring Activity</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hiringTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#8892A4" style={{ fontSize: 12 }} />
              <YAxis stroke="#8892A4" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#141828', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="applications" fill="rgba(123,94,167,0.5)" name="Applications" radius={[4, 4, 0, 0]} />
              <Bar dataKey="hires" fill="#10B981" name="Hires" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Spending trend */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-6">Monthly Spend</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={spendingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#8892A4" style={{ fontSize: 12 }} />
              <YAxis stroke="#8892A4" style={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ backgroundColor: '#141828', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' }} formatter={(v: any) => [`₹${Number(v || 0).toLocaleString('en-IN')}`, 'Spend']} />
              <Line type="monotone" dataKey="amount" stroke="#7B5EA7" strokeWidth={2} dot={{ fill: '#7B5EA7', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top skills hired */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-4">Top Skills Hired</h2>
          <div className="space-y-3">
            {topSkills.map((item, i) => (
              <div key={item.skill} className="flex items-center gap-4">
                <span className="text-xs font-mono text-text-muted w-4">{i + 1}</span>
                <span className="text-sm text-text-secondary w-28">{item.skill}</span>
                <div className="flex-1 h-2 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-violet rounded-full transition-all duration-700"
                    style={{ width: `${(item.count / topSkills[0].count) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-text-muted w-8 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
