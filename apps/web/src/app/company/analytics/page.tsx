'use client';

import * as React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyAnalytics } from '@/lib/api-hooks';
import { cn } from '@/lib/utils';

function formatMonth(date: string | Date) {
  return new Date(date).toLocaleDateString('en-IN', { month: 'short' });
}

export default function CompanyAnalyticsPage() {
  const { data, isLoading, isError } = useCompanyAnalytics();

  if (isLoading) {
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

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <h1 className="font-display text-2xl font-bold text-text-primary">Hiring Analytics</h1>
          <p className="text-text-muted text-sm mt-4">Analytics will appear once you start posting tasks and hiring.</p>
        </div>
      </div>
    );
  }

  const { summary, trends } = data;
  const jobsPosted = trends?.jobsPosted ?? [];
  const hires = trends?.hires ?? [];
  const applications = trends?.applications ?? [];
  const spending = trends?.spending ?? [];

  const hiringTrend = jobsPosted.map((d, i) => ({
    month: formatMonth(d.date),
    jobs: d.value,
    hires: hires[i]?.value ?? 0,
    applications: applications[i]?.value ?? 0,
  }));

  const spendingTrend = spending.map((d) => ({
    month: formatMonth(d.date),
    amount: d.value,
  }));

  const hasChartData = hiringTrend.length > 0;

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">Hiring Analytics</h1>
          <p className="text-text-secondary text-sm mt-1">Track your hiring performance and spend</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Jobs Posted',       value: summary.totalJobsPosted,  colorClass: 'text-accent-cyan' },
            { label: 'Applications',      value: summary.totalApplications, colorClass: 'text-accent-violet' },
            { label: 'Hires Made',        value: summary.totalHires,        colorClass: 'text-accent-green' },
            { label: 'Avg Time to Hire',  value: `${summary.avgTimeToHire} days`, colorClass: 'text-accent-amber' },
            { label: 'Total Spend',       value: `₹${(summary.totalSpent / 1000).toFixed(0)}K`, colorClass: 'text-accent-red' },
            { label: 'Cost per Hire',     value: `₹${(parseFloat(summary.costPerHire) / 1000).toFixed(0)}K`, colorClass: 'text-text-muted' },
          ].map((stat) => (
            <div key={stat.label} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
              <p className="text-xs text-text-muted mb-2">{stat.label}</p>
              <p className={cn('font-mono font-bold text-2xl', stat.colorClass)}>{stat.value}</p>
            </div>
          ))}
        </div>

        {hasChartData ? (
          <>
            <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
              <h2 className="font-display font-semibold text-text-primary text-lg mb-6">Hiring Activity</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hiringTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#8892A4" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#8892A4" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#141828', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="applications" fill="rgba(123,94,167,0.5)" name="Applications" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hires" fill="#10B981" name="Hires" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
              <h2 className="font-display font-semibold text-text-primary text-lg mb-6">Monthly Spend</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={spendingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#8892A4" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#8892A4" tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ backgroundColor: '#141828', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' }} formatter={(v) => [`₹${Number(v ?? 0).toLocaleString('en-IN')}`, 'Spend']} />
                  <Line type="monotone" dataKey="amount" stroke="#7B5EA7" strokeWidth={2} dot={{ fill: '#7B5EA7', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-12 text-center">
            <p className="text-text-muted text-sm">Chart data will populate as you post tasks and hire engineers.</p>
          </div>
        )}
      </div>
    </div>
  );
}
