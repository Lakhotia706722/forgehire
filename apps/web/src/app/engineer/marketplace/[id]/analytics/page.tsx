'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { MOCK_ANALYTICS } from '@/lib/marketplace-data';
import { useProductAnalytics } from '@/lib/api-hooks';
import { wPctClass } from '@/lib/pct-classes';

// SSR-safe Recharts imports
const AreaChart      = dynamic(() => import('recharts').then((m) => m.AreaChart),      { ssr: false });
const Area           = dynamic(() => import('recharts').then((m) => m.Area),           { ssr: false });
const LineChart      = dynamic(() => import('recharts').then((m) => m.LineChart),      { ssr: false });
const Line           = dynamic(() => import('recharts').then((m) => m.Line),           { ssr: false });
const XAxis          = dynamic(() => import('recharts').then((m) => m.XAxis),          { ssr: false });
const YAxis          = dynamic(() => import('recharts').then((m) => m.YAxis),          { ssr: false });
const CartesianGrid  = dynamic(() => import('recharts').then((m) => m.CartesianGrid),  { ssr: false });
const Tooltip        = dynamic(() => import('recharts').then((m) => m.Tooltip),        { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false });

type Period = 'daily' | 'weekly' | 'monthly';

export default function ProductAnalyticsPage({ params }: { params: { id: string } }) {
  const { data: apiData, isLoading } = useProductAnalytics(params.id);
  const [period, setPeriod] = React.useState<Period>('daily');

  const analytics = React.useMemo(() => {
    if (!apiData) return MOCK_ANALYTICS;
    const totalViews = apiData.funnel.views || 1;
    return {
      revenue: apiData.revenue,
      funnel: apiData.funnel,
      ratingTrend: apiData.ratingTrend.map((r) => ({ month: r.date.slice(5), rating: r.rating })),
      industryBreakdown: apiData.topIndustries.map((ind) => ({
        industry: ind.industry,
        count: ind.count,
        pct: Math.round((ind.count / totalViews) * 100),
      })),
      recentPurchases: [] as { id: string; buyerAnon: string; date: string; plan: string; amount: number }[],
    };
  }, [apiData]);

  const product = {
    name: apiData?.productName ?? 'Product',
    rating: apiData?.ratingTrend?.[apiData.ratingTrend.length - 1]?.rating ?? 4.8,
  };

  const loading = isLoading;

  // Aggregate revenue data by period
  const revenueData = React.useMemo(() => {
    if (period === 'daily') return analytics.revenue.slice(-14).map((d) => ({ ...d, label: d.date.slice(5) }));
    if (period === 'weekly') {
      const weeks: { label: string; revenue: number; sales: number }[] = [];
      for (let i = 0; i < analytics.revenue.length; i += 7) {
        const chunk = analytics.revenue.slice(i, i + 7);
        weeks.push({
          label: `W${Math.floor(i / 7) + 1}`,
          revenue: chunk.reduce((s, d) => s + d.revenue, 0),
          sales: chunk.reduce((s, d) => s + d.sales, 0),
        });
      }
      return weeks;
    }
    return [{ label: 'Nov', revenue: analytics.revenue.reduce((s, d) => s + d.revenue, 0), sales: analytics.revenue.reduce((s, d) => s + d.sales, 0) }];
  }, [period, analytics.revenue]);

  const totalRevenue = analytics.revenue.reduce((s, d) => s + d.revenue, 0);
  const totalSales   = analytics.revenue.reduce((s, d) => s + d.sales, 0);
  const { funnel } = analytics;
  const demoConvRate = ((funnel.demoClicks / funnel.views) * 100).toFixed(1);
  const buyConvRate  = ((funnel.purchases / funnel.demoClicks) * 100).toFixed(1);

  const customTooltipStyle = {
    backgroundColor: '#141828',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#F0F4FF',
    fontSize: '12px',
    fontFamily: 'JetBrains Mono, monospace',
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">{product.name}</h1>
          <p className="text-text-secondary text-sm mt-1">Analytics Dashboard</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, className: 'kpi-value-amber' },
            { label: 'Total Sales', value: String(totalSales), className: 'kpi-value-cyan' },
            { label: 'Total Views', value: String(funnel.views), className: 'kpi-value-violet' },
            { label: 'Avg Rating', value: `${product.rating} ★`, className: 'kpi-value-green' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">{kpi.label}</p>
              <p className={cn('font-mono font-bold text-xl', kpi.className)}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-5" data-testid="revenue-chart">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-text-primary">Revenue</h2>
            <div className="flex gap-1" role="group" aria-label="Time period">
              {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={cn('text-xs px-3 py-1.5 rounded-lg transition-all', period === p ? 'bg-accent-cyan text-bg-base font-semibold' : 'text-text-muted border border-[rgba(255,255,255,0.08)] hover:text-text-secondary')}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="h-48 w-full" data-testid="area-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00D4FF" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="label" tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={customTooltipStyle} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#00D4FF" strokeWidth={2} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Sales funnel */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-5" data-testid="sales-funnel">
          <h2 className="font-display font-semibold text-text-primary mb-5">Sales Funnel</h2>
          <div className="space-y-3">
            {[
              { label: 'Views', value: funnel.views, pct: 100, pctClass: 'dim-pct-violet', barClass: 'funnel-bar-violet' },
              { label: 'Demo Clicks', value: funnel.demoClicks, pct: (funnel.demoClicks / funnel.views) * 100, pctClass: 'dim-pct-cyan', barClass: 'funnel-bar-cyan' },
              { label: 'Purchases', value: funnel.purchases, pct: (funnel.purchases / funnel.views) * 100, pctClass: 'dim-pct-green', barClass: 'funnel-bar-green' },
            ].map((stage) => (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-text-secondary">{stage.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-text-primary">{stage.value.toLocaleString()}</span>
                    <span className={cn('text-xs font-mono', stage.pctClass)}>{stage.pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all duration-700', stage.barClass, wPctClass(stage.pct))} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-4 text-xs text-text-muted">
            <span>Demo CTR: <span className="text-accent-cyan font-mono">{demoConvRate}%</span></span>
            <span>Demo → Buy: <span className="text-accent-green font-mono">{buyConvRate}%</span></span>
          </div>
        </div>

        {/* Industry breakdown + Rating trend */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Industry breakdown */}
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-5" data-testid="industry-chart">
            <h2 className="font-display font-semibold text-text-primary mb-4">Buyer Industries</h2>
            <div className="space-y-3">
              {analytics.industryBreakdown.map((ind) => (
                <div key={ind.industry}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-secondary">{ind.industry}</span>
                    <span className="text-xs font-mono text-text-muted">{ind.count} ({ind.pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                    <div className={cn('h-full bg-accent-violet rounded-full', wPctClass(ind.pct))} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rating trend */}
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-5" data-testid="rating-chart">
            <h2 className="font-display font-semibold text-text-primary mb-4">Rating Trend</h2>
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.ratingTrend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[4, 5]} tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Line type="monotone" dataKey="rating" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Recent purchases */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-5" data-testid="recent-purchases">
          <h2 className="font-display font-semibold text-text-primary mb-4">Recent Purchases</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  {['Buyer', 'Date', 'Plan', 'Amount'].map((h) => (
                    <th key={h} className="text-left text-xs text-text-muted font-medium py-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analytics.recentPurchases.map((p) => (
                  <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                    <td className="py-2.5 pr-4 text-text-secondary">{p.buyerAnon}</td>
                    <td className="py-2.5 pr-4 text-text-muted font-mono text-xs">{p.date}</td>
                    <td className="py-2.5 pr-4"><span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(0,212,255,0.08)] text-accent-cyan border border-[rgba(0,212,255,0.15)] font-mono">{p.plan}</span></td>
                    <td className="py-2.5 font-mono text-accent-amber">₹{p.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
