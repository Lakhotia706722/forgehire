'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useMyEngineerProfile, type EngineerProfileData } from '@/lib/api-hooks';
import { extractApiErrorMessage } from '@/lib/api-fetch';
import { useApiAuth } from '@/components/providers/api-auth-provider';
import {
  buildProfilePatchPayload,
  mapEngineerProfileToForm,
  validateProfileFormName,
  type EngineerProfileForm as ProfileForm,
} from '@/lib/engineer-profile-form';
import { useUpdateEngineerProfile } from '@/lib/api-hooks';

const PROFICIENCY_VARIANT: Record<string, 'cyan' | 'violet' | 'amber' | 'green'> = {
  expert: 'amber',
  advanced: 'cyan',
  intermediate: 'violet',
  beginner: 'green',
};

const EMPTY_FORM: ProfileForm = {
  fullName: '',
  headline: '',
  bio: '',
  location: '',
  githubUrl: '',
  linkedinUrl: '',
  portfolioUrl: '',
  hourlyRate: 0,
  availabilityStatus: 'available_now',
};

export default function EngineerProfilePage() {
  const { status: apiAuthStatus, error: apiAuthError, retrySync } = useApiAuth();
  const { data: profile, isLoading, isError, error, refetch } = useMyEngineerProfile();

  const [form, setForm] = React.useState<ProfileForm>(EMPTY_FORM);
  const [isDirty, setIsDirty] = React.useState(false);

  // Load saved profile into the form whenever API data changes
  React.useEffect(() => {
    if (!profile) return;
    setForm(mapEngineerProfileToForm(profile));
    setIsDirty(false);
  }, [profile]);

  const updateProfile = useUpdateEngineerProfile();

  function handleSave(data: ProfileForm) {
    const nameError = validateProfileFormName(data.fullName);
    if (nameError) {
      toast.error(nameError);
      return;
    }
    updateProfile.mutate(buildProfilePatchPayload(data), {
      onSuccess: (updated) => {
        if (updated) {
          setForm(mapEngineerProfileToForm(updated));
        }
        setIsDirty(false);
        toast.success('Profile saved successfully');
      },
      onError: (err: Error) => {
        toast.error(err.message || 'Failed to save profile');
      },
    });
  }

  function patch(updates: Partial<ProfileForm>) {
    setForm((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }

  if (apiAuthStatus === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (apiAuthStatus === 'failed') {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
            Could not connect to the API
          </h1>
          <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
            {apiAuthError ||
              'Start the API (`npm run dev` in apps/api) and ensure you are signed in as an engineer.'}
          </p>
          <Button size="md" onClick={retrySync}>
            Retry connection
          </Button>
        </div>
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof Error
        ? error.message
        : extractApiErrorMessage(error, 'Failed to load profile');
    const isForbidden = message.toLowerCase().includes('403') || message.includes('denied');

    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
            Could not load profile
          </h1>
          <p className="text-text-secondary text-sm mb-2 max-w-md mx-auto">{message}</p>
          {isForbidden && (
            <p className="text-text-muted text-xs mb-6 max-w-md mx-auto">
              This page requires an engineer account. Sign out and sign in with an engineer
              account, or update your role in Clerk.
            </p>
          )}
          {!isForbidden && (
            <p className="text-text-muted text-xs mb-6">
              API: {process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}
            </p>
          )}
          <Button size="md" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const skills = profile.skills ?? [];

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">
              Edit Profile
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Keep your profile up to date to attract better opportunities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/engineer/profile/preview">
              <Button variant="secondary" size="md">
                Preview →
              </Button>
            </Link>
            <Button
              size="md"
              loading={updateProfile.isPending}
              disabled={!isDirty}
              onClick={() => handleSave(form)}
            >
              Save Changes
            </Button>
          </div>
        </div>

        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">Profile Completeness</span>
            <span className="text-sm font-mono font-bold text-accent-cyan">
              {profile.completenessScore ?? profile.completeness?.score ?? 0}%
            </span>
          </div>
          <Progress
            value={profile.completenessScore ?? profile.completeness?.score ?? 0}
            color="cyan"
            size="md"
          />
        </div>

        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-text-primary text-lg">Basic Information</h2>
          <Input
            label="Full Name"
            value={form.fullName}
            onChange={(e) => patch({ fullName: e.target.value })}
          />
          <Input
            label="Headline"
            value={form.headline}
            onChange={(e) => patch({ headline: e.target.value })}
            hint="e.g. LLM Engineer · RAG Systems · Agentic AI"
          />
          <div>
            <label
              htmlFor="engineer-bio"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              Bio
            </label>
            <textarea
              id="engineer-bio"
              name="bio"
              value={form.bio}
              onChange={(e) => patch({ bio: e.target.value })}
              rows={4}
              className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none transition-all"
            />
          </div>
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => patch({ location: e.target.value })}
          />
        </div>

        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-text-primary text-lg">Links</h2>
          <Input
            label="GitHub URL"
            type="url"
            value={form.githubUrl}
            onChange={(e) => patch({ githubUrl: e.target.value })}
          />
          <Input
            label="LinkedIn URL"
            type="url"
            value={form.linkedinUrl}
            onChange={(e) => patch({ linkedinUrl: e.target.value })}
          />
          <Input
            label="Portfolio URL"
            type="url"
            value={form.portfolioUrl}
            onChange={(e) => patch({ portfolioUrl: e.target.value })}
          />
        </div>

        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-text-primary text-lg">
            Pricing & Availability
          </h2>
          <div>
            <label
              htmlFor="engineer-hourly-rate"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              Hourly Rate (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono pointer-events-none">
                ₹
              </span>
              <input
                id="engineer-hourly-rate"
                name="hourlyRate"
                type="number"
                value={form.hourlyRate}
                onChange={(e) => patch({ hourlyRate: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl pl-10 pr-4 py-3 font-mono text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Availability
            </label>
            <div className="flex gap-3">
              {(['available_now', 'available_in_weeks', 'not_available'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => patch({ availabilityStatus: status })}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all',
                    form.availabilityStatus === status
                      ? 'bg-[rgba(0,212,255,0.08)] text-accent-cyan border-[rgba(0,212,255,0.3)]'
                      : 'border-[rgba(255,255,255,0.06)] text-text-muted hover:border-[rgba(255,255,255,0.15)]',
                  )}
                >
                  {status === 'available_now'
                    ? 'Available Now'
                    : status === 'available_in_weeks'
                      ? 'In a Few Weeks'
                      : 'Not Available'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-text-primary text-lg">Skills</h2>
            <Link href="/engineer/onboarding" className="text-xs text-accent-cyan hover:underline">
              Edit in wizard →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge
                key={skill.id}
                variant={PROFICIENCY_VARIANT[skill.proficiencyLevel] ?? 'gray'}
              >
                {skill.skillName} · {skill.proficiencyLevel}
              </Badge>
            ))}
            {skills.length === 0 && (
              <p className="text-xs text-text-muted">
                No skills added yet.{' '}
                <Link href="/engineer/onboarding" className="text-accent-cyan hover:underline">
                  Add skills →
                </Link>
              </p>
            )}
          </div>
        </div>

        {isDirty && (
          <div className="sticky bottom-4 flex justify-end">
            <div className="bg-bg-elevated border border-[rgba(0,212,255,0.2)] rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
              <p className="text-sm text-text-secondary">You have unsaved changes</p>
              <Button size="sm" loading={updateProfile.isPending} onClick={() => handleSave(form)}>
                Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
