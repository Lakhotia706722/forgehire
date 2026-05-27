'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { TierBadge, Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyEngineerProfile } from '@/lib/api-hooks';
import { avatarToneClass, initialsFromName } from '@/lib/avatar-tone';

const AVAILABILITY_LABEL: Record<string, string> = {
  available_now: 'Available Now',
  available_in_weeks: 'Available in a Few Weeks',
  not_available: 'Not Available',
};

export default function ProfilePreviewPage() {
  const { data: profile, isLoading, isError, refetch } = useMyEngineerProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base px-4 py-16 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-bg-base px-4 py-16 max-w-5xl mx-auto text-center">
        <h1 className="font-display text-xl font-bold text-text-primary mb-2">
          Could not load profile
        </h1>
        <p className="text-text-secondary text-sm mb-6">
          Sign in as an engineer and save your profile first.
        </p>
        <div className="flex justify-center gap-3">
          <Button size="md" onClick={() => refetch()}>
            Retry
          </Button>
          <Link href="/engineer/profile">
            <Button variant="secondary" size="md">
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const skills = profile.skills ?? [];
  const completeness = profile.completenessScore ?? profile.completeness?.score ?? 0;
  const availabilityLabel =
    AVAILABILITY_LABEL[profile.availabilityStatus] ?? profile.availabilityStatus;
  const hourlyRate = Number(profile.hourlyRate) || 0;

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="sticky top-0 z-40 bg-[rgba(245,158,11,0.1)] border-b border-[rgba(245,158,11,0.2)] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-accent-amber">👁 PREVIEW MODE</span>
            <span className="text-xs text-text-muted">
              This is how your profile appears to companies
            </span>
          </div>
          <Link href="/engineer/profile">
            <Button variant="secondary" size="sm">
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center font-display font-bold text-bg-base text-2xl shrink-0 ${avatarToneClass(profile.fullName)}`}
              aria-hidden="true"
            >
              {initialsFromName(profile.fullName)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-display text-2xl font-bold text-text-primary">
                  {profile.fullName || 'Your name'}
                </h1>
                <TierBadge tier={profile.neuronTier} />
              </div>
              {profile.headline && (
                <p className="text-text-secondary text-sm mb-3">{profile.headline}</p>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-text-muted mb-4">
                {profile.location && <span>📍 {profile.location}</span>}
                <span
                  className={
                    profile.availabilityStatus === 'available_now'
                      ? 'text-accent-green'
                      : ''
                  }
                >
                  ● {availabilityLabel}
                </span>
                {hourlyRate > 0 && (
                  <span>₹{hourlyRate.toLocaleString('en-IN')}/hr</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill.id} variant="gray">
                    {skill.skillName}
                  </Badge>
                ))}
                {skills.length === 0 && (
                  <p className="text-xs text-text-muted">No skills added yet</p>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <NeuronScoreRing
                score={profile.neuronScore ?? 0}
                size={80}
                strokeWidth={6}
                animate={false}
              />
            </div>
          </div>
        </div>

        {profile.bio && (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="font-display font-semibold text-text-primary text-lg mb-3">
              About
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          </div>
        )}

        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <p className="text-sm text-text-muted">
            Profile completeness:{' '}
            <span className="font-mono text-accent-cyan">{completeness}%</span>
          </p>
        </div>

        <div className="bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.15)] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-display font-semibold text-text-primary">
              Interested in working with {profile.fullName?.split(' ')[0] || 'this engineer'}?
            </p>
            <p className="text-text-muted text-sm mt-1">
              Send a message request or post a bounty
            </p>
          </div>
          <div className="flex gap-3">
            <Button size="md" disabled>
              Message
            </Button>
            <Button variant="secondary" size="md" disabled>
              Hire
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
