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
import { useMyEngineerProfile, useUpdateSettings } from '@/lib/api-hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const PROFICIENCY_VARIANT: Record<string, 'cyan' | 'violet' | 'amber' | 'green'> = {
  expert:       'amber',
  advanced:     'cyan',
  intermediate: 'violet',
  beginner:     'green',
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options?.headers },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export default function EngineerProfilePage() {
  const qc = useQueryClient();
  const { data: profile, isLoading } = useMyEngineerProfile();

  const [form, setForm] = React.useState({
    fullName: '', headline: '', bio: '', location: '',
    githubUrl: '', linkedinUrl: '', portfolioUrl: '', hourlyRate: 0,
    availabilityStatus: 'available_now',
  });
  const [isDirty, setIsDirty] = React.useState(false);
  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (!initialized.current && profile) {
      initialized.current = true;
      setForm({
        fullName: profile.fullName || '',
        headline: profile.headline || '',
        bio: profile.bio || '',
        location: (profile as any).location || '',
        githubUrl: (profile as any).githubUrl || '',
        linkedinUrl: (profile as any).linkedinUrl || '',
        portfolioUrl: (profile as any).portfolioUrl || '',
        hourlyRate: profile.hourlyRate || 0,
        availabilityStatus: profile.availabilityStatus || 'available_now',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.fullName]);

  const save = useMutation({
    mutationFn: (data: typeof form) =>
      apiFetch('/api/engineer/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['engineer', 'me'] });
      setIsDirty(false);
      toast.success('Profile saved successfully');
    },
    onError: () => toast.error('Failed to save profile'),
  });

  function patch(updates: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">Edit Profile</h1>
            <p className="text-text-secondary text-sm mt-1">Keep your profile up to date to attract better opportunities</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/engineer/profile/preview">
              <Button variant="secondary" size="md">Preview →</Button>
            </Link>
            <Button size="md" loading={save.isPending} disabled={!isDirty} onClick={() => save.mutate(form)}>
              Save Changes
            </Button>
          </div>
        </div>

        {/* Completeness */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">Profile Completeness</span>
            <span className="text-sm font-mono font-bold text-accent-cyan">{profile?.completenessScore ?? 0}%</span>
          </div>
          <Progress value={profile?.completenessScore ?? 0} color="cyan" size="md" />
        </div>

        {/* Basic Info */}
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
            <label className="block text-sm font-medium text-text-secondary mb-2">Bio</label>
            <textarea
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

        {/* Links */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-text-primary text-lg">Links</h2>
          <Input label="GitHub URL" type="url" value={form.githubUrl} onChange={(e) => patch({ githubUrl: e.target.value })} />
          <Input label="LinkedIn URL" type="url" value={form.linkedinUrl} onChange={(e) => patch({ linkedinUrl: e.target.value })} />
          <Input label="Portfolio URL" type="url" value={form.portfolioUrl} onChange={(e) => patch({ portfolioUrl: e.target.value })} />
        </div>

        {/* Pricing */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-text-primary text-lg">Pricing & Availability</h2>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Hourly Rate (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono pointer-events-none">₹</span>
              <input
                type="number"
                value={form.hourlyRate}
                onChange={(e) => patch({ hourlyRate: parseInt(e.target.value) || 0 })}
                className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl pl-10 pr-4 py-3 font-mono text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Availability</label>
            <div className="flex gap-3">
              {(['available_now', 'available_in_weeks', 'not_available'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => patch({ availabilityStatus: status })}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all',
                    form.availabilityStatus === status
                      ? 'bg-[rgba(0,212,255,0.08)] text-accent-cyan border-[rgba(0,212,255,0.3)]'
                      : 'border-[rgba(255,255,255,0.06)] text-text-muted hover:border-[rgba(255,255,255,0.15)]'
                  )}
                >
                  {status === 'available_now' ? 'Available Now' : status === 'available_in_weeks' ? 'In a Few Weeks' : 'Not Available'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-text-primary text-lg">Skills</h2>
            <Link href="/engineer/onboarding" className="text-xs text-accent-cyan hover:underline">
              Edit in wizard →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {((profile as any).skills ?? []).map((skill: any) => (
              <Badge key={skill.id} variant={PROFICIENCY_VARIANT[skill.proficiencyLevel] ?? 'gray'}>
                {skill.skillName} · {skill.proficiencyLevel}
              </Badge>
            ))}
            {!((profile as any).skills?.length) && (
              <p className="text-xs text-text-muted">No skills added yet. <Link href="/engineer/onboarding" className="text-accent-cyan hover:underline">Add skills →</Link></p>
            )}
          </div>
        </div>

        {/* Save footer */}
        {isDirty && (
          <div className="sticky bottom-4 flex justify-end">
            <div className="bg-bg-elevated border border-[rgba(0,212,255,0.2)] rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
              <p className="text-sm text-text-secondary">You have unsaved changes</p>
              <Button size="sm" loading={save.isPending} onClick={() => save.mutate(form)}>Save</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
