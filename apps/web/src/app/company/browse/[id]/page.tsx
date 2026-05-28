'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge, TierBadge } from '@/components/ui/badge';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { Skeleton } from '@/components/ui/skeleton';
import { HireModal } from '../_components/hire-modal';
import { usePublicEngineerProfile } from '@/lib/api-hooks';
import { mapApiEngineerToPublicProfile } from '@/lib/map-api-engineer-profile';
import { avatarToneClass } from '@/lib/avatar-tone';
import { apiFetch } from '@/lib/api-fetch';

export default function CompanyEngineerViewPage({ params }: { params: { id: string } }) {
  const { data, isLoading, isError } = usePublicEngineerProfile(params.id);
  const [showHireModal, setShowHireModal] = React.useState(false);
  const [jobRequirements, setJobRequirements] = React.useState('');
  const [hiringMatch, setHiringMatch] = React.useState<{
    skillMatchScore: number;
    budgetFit: string;
    availabilityConfidence: string;
    recommendationReason: string;
  } | null>(null);

  const engineer = data ? mapApiEngineerToPublicProfile(data) : null;
  React.useEffect(() => {
    const value = jobRequirements.trim();
    if (value.length < 10) {
      setHiringMatch(null);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const result = await apiFetch<{
          skillMatchScore: number;
          budgetFit: string;
          availabilityConfidence: string;
          recommendationReason: string;
        }>(`/api/engineers/${params.id}/hiring-match?jobRequirements=${encodeURIComponent(value)}`);
        setHiringMatch(result);
      } catch {
        setHiringMatch(null);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [jobRequirements, params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-8">
            <div className="flex items-start gap-6">
              <Skeleton circle className="w-20 h-20" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !engineer) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-primary font-semibold mb-2">Engineer not found</p>
          <Link href="/company/browse" className="text-accent-cyan text-sm hover:underline">
            Back to browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/company/browse" className="hover:text-text-secondary">Browse Engineers</Link>
          <span>/</span>
          <span className="text-text-secondary">{engineer.name}</span>
        </div>

        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center font-display font-bold text-bg-base text-2xl shrink-0 ${avatarToneClass(engineer.name)}`}
              aria-hidden="true"
            >
              {engineer.avatarInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-display text-2xl font-bold text-text-primary">{engineer.name}</h1>
                <TierBadge tier={engineer.tier} />
              </div>
              <p className="text-text-secondary text-sm mb-3">{engineer.headline}</p>
              <div className="flex flex-wrap gap-4 text-xs text-text-muted mb-4">
                <span>📍 {engineer.location}</span>
                <span className="text-accent-green">● {engineer.availabilityLabel}</span>
                <span>₹{engineer.hourlyRateINR.toLocaleString('en-IN')}/hr</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {engineer.skills.map((skill) => (
                  <Badge key={skill.name} variant="gray">{skill.name}</Badge>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <NeuronScoreRing score={engineer.neuronScore} size={80} strokeWidth={6} animate={false} />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
            <Button size="md" onClick={() => setShowHireModal(true)}>
              Hire {engineer.name.split(' ')[0]}
            </Button>
            <Link
              href={`/company/messages/${params.id}`}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium bg-transparent text-accent-cyan border border-[rgba(0,212,255,0.3)] hover:border-[rgba(0,212,255,0.6)] hover:bg-[rgba(0,212,255,0.05)] transition-all"
            >
              Send Message
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Projects Done', value: engineer.projectCount, className: 'text-accent-cyan' },
            { label: 'Rating', value: `${engineer.rating}★`, className: 'text-accent-amber' },
            { label: 'Response Rate', value: `${engineer.responseRate}%`, className: 'text-accent-green' },
            { label: 'Reviews', value: engineer.reviewCount, className: 'text-accent-violet' },
          ].map((stat) => (
            <div key={stat.label} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
              <p className={`font-mono font-bold text-xl ${stat.className}`}>{stat.value}</p>
              <p className="text-xs text-text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-3">About</h2>
          <p className="text-text-secondary text-sm leading-relaxed">{engineer.bio || 'No bio provided.'}</p>
        </div>

        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-semibold text-text-primary text-lg">Smart Hiring Suggestion</h2>
          <textarea
            value={jobRequirements}
            onChange={(e) => setJobRequirements(e.target.value)}
            rows={3}
            placeholder="Paste job requirements to get skill match and budget fit insights..."
            className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary"
          />
          {hiringMatch ? (
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-bg-elevated rounded-xl p-3">
                <p className="text-xs text-text-muted">Skill Match</p>
                <p className="font-mono text-accent-cyan mt-1">{hiringMatch.skillMatchScore}%</p>
              </div>
              <div className="bg-bg-elevated rounded-xl p-3">
                <p className="text-xs text-text-muted">Budget Fit</p>
                <p className="text-text-primary mt-1">{hiringMatch.budgetFit}</p>
              </div>
              <div className="bg-bg-elevated rounded-xl p-3 sm:col-span-2">
                <p className="text-xs text-text-muted">Availability Confidence</p>
                <p className="text-text-primary mt-1">{hiringMatch.availabilityConfidence}</p>
                <p className="text-xs text-text-secondary mt-2">{hiringMatch.recommendationReason}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted">Enter requirements (min 10 chars) to see match insights.</p>
          )}
        </div>
      </div>

      {showHireModal && (
        <HireModal
          open={showHireModal}
          onClose={() => setShowHireModal(false)}
          engineerName={engineer.name}
          engineerHourlyRate={engineer.hourlyRateINR}
          engineerProfileId={params.id}
          engineerUserId={String(data?.userId ?? '')}
        />
      )}
    </div>
  );
}
