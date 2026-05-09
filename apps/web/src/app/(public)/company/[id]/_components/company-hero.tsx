import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrustScoreArc } from './trust-score-arc';
import type { CompanyProfile } from '@/lib/mock-data';

interface CompanyHeroProps {
  company: CompanyProfile;
}

export function CompanyHero({ company: co }: CompanyHeroProps) {
  return (
    <div className="relative">
      {/* Banner */}
      <div
        className="h-36 w-full geo-pattern"
        style={{
          background:
            'linear-gradient(135deg, rgba(123,94,167,0.08) 0%, rgba(0,212,255,0.05) 50%, rgba(8,11,20,1) 100%)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto px-6">
        <div className="relative -mt-12 pb-8">
          {/* Logo + info row */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 mb-6">
            {/* Logo */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center font-display font-bold text-bg-base text-xl border-4 border-bg-base shrink-0"
              style={{ background: co.logoColor }}
              aria-label={`${co.name} logo`}
            >
              {co.logoInitials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">
                  {co.name}
                </h1>
                {co.websiteVerified && (
                  <Badge variant="cyan" className="text-[10px]">
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Verified
                  </Badge>
                )}
                <Badge variant="green">Hiring</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                <Badge variant="violet">{co.industry}</Badge>
                <span>{co.location}</span>
                <span>{co.size} employees</span>
                <a href={`https://${co.website}`} target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline">
                  {co.website} ↗
                </a>
              </div>
            </div>

            {/* Trust score arc */}
            <div className="shrink-0" data-testid="trust-score-arc">
              <TrustScoreArc score={co.trustScore} />
            </div>
          </div>

          {/* Description */}
          <p className="text-text-secondary text-sm leading-relaxed max-w-2xl mb-6">
            {co.description}
          </p>

          {/* Stats row */}
          <div
            className="flex flex-wrap gap-x-6 gap-y-3 mb-6 pb-6 border-b border-[rgba(255,255,255,0.06)]"
            role="list"
            aria-label="Company statistics"
          >
            {[
              { label: 'Tasks Posted',     value: String(co.tasksPosted) },
              { label: 'Engineers Hired',  value: String(co.engineersHired) },
              { label: 'Platform Spend',   value: co.spendRange },
              { label: 'Avg Rating',       value: `${co.avgRating}★` },
            ].map((stat, i, arr) => (
              <div key={stat.label} className="flex items-center gap-4" role="listitem">
                <div>
                  <p className="font-mono text-sm font-semibold text-text-primary">{stat.value}</p>
                  <p className="text-xs text-text-muted">{stat.label}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-px h-8 bg-[rgba(255,255,255,0.06)]" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>

          {/* Quick insights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Response Rate',       value: `${co.responseRate}%` },
              { label: 'Avg Response Time',   value: co.avgResponseTime },
              { label: 'Hiring Success',      value: `${co.hiringSuccessRate}%` },
              { label: 'Repeat Hire Rate',    value: `${co.repeatHireRate}%` },
            ].map((insight) => (
              <div
                key={insight.label}
                className="bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl p-3 text-center"
              >
                <p className="font-mono font-semibold text-accent-cyan text-lg leading-none mb-1">
                  {insight.value}
                </p>
                <p className="text-xs text-text-muted">{insight.label}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Button size="md">View Open Roles</Button>
            <Button variant="secondary" size="md">Message</Button>
            <Button variant="ghost" size="md">Follow</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
