'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AriaSwitch } from '@/components/ui/aria-tab-button';
import { toast } from 'sonner';
import { useCompanyProfile, useUpdateCompanyProfile } from '@/lib/api-hooks';

const HIRING_INTENTS = ['full_time', 'freelance', 'project', 'bounty'] as const;
const AI_REQUIREMENTS = ['chatbots', 'automation', 'agents', 'data', 'vision', 'nlp', 'mlops'] as const;

type ProfileForm = {
  companyName: string;
  description: string;
  website: string;
  location: string;
  industry: string;
  size: string;
  gstNumber: string;
  isHiring: boolean;
  hiringIntents: string[];
  aiRequirements: string[];
};

const EMPTY_PROFILE: ProfileForm = {
  companyName: '',
  description: '',
  website: '',
  location: '',
  industry: '',
  size: '',
  gstNumber: '',
  isHiring: false,
  hiringIntents: [],
  aiRequirements: [],
};

export default function CompanyProfilePage() {
  const { data: apiProfile, isLoading: loading, isError: profileError } = useCompanyProfile();
  const updateProfile = useUpdateCompanyProfile();
  const [profile, setProfile] = React.useState<ProfileForm>(EMPTY_PROFILE);
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    if (apiProfile) {
      setProfile({
        companyName: apiProfile.companyName ?? '',
        description: apiProfile.description ?? '',
        website: apiProfile.website ?? '',
        location: apiProfile.location ?? '',
        industry: apiProfile.industry ?? '',
        size: apiProfile.size ?? '',
        gstNumber: apiProfile.gstNumber ?? '',
        isHiring: apiProfile.isHiring ?? false,
        hiringIntents: apiProfile.hiringIntents ?? [],
        aiRequirements: apiProfile.aiRequirements ?? [],
      });
    }
  }, [apiProfile]);

  function patch(updates: Partial<ProfileForm>) {
    setProfile((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }

  function toggleArray(key: 'hiringIntents' | 'aiRequirements', value: string) {
    setProfile((prev) => ({
      ...prev,
      [key]: (prev[key] as string[]).includes(value)
        ? (prev[key] as string[]).filter((v) => v !== value)
        : [...(prev[key] as string[]), value],
    }));
    setIsDirty(true);
  }

  async function handleSave() {
    try {
      await updateProfile.mutateAsync(profile);
      setIsDirty(false);
      toast.success('Company profile saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save profile');
    }
  }

  if (loading) {
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

  if (profileError) {
    return (
      <div className="min-h-screen bg-bg-base flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-xl p-6 text-center">
            <p className="text-red-400 font-medium mb-2">Could not load company profile</p>
            <p className="text-sm text-text-muted mb-4">Please check your connection and try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-accent-cyan hover:underline"
            >
              Reload page
            </button>
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
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">Company Profile</h1>
            <p className="text-text-secondary text-sm mt-1">Manage your public company profile</p>
          </div>
          <Button size="md" loading={updateProfile.isPending} disabled={!isDirty} onClick={handleSave}>
            Save Changes
          </Button>
        </div>

        {/* Basic Info */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-text-primary text-lg">Company Information</h2>
          <Input label="Company Name" value={profile.companyName} onChange={(e) => patch({ companyName: e.target.value })} />
          <div>
            <label htmlFor="company-description" className="block text-sm font-medium text-text-secondary mb-2">Description</label>
            <textarea
              id="company-description"
              value={profile.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={3}
              className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[rgba(123,94,167,0.4)] resize-none transition-all"
            />
          </div>
          <Input label="Website" type="url" value={profile.website} onChange={(e) => patch({ website: e.target.value })} />
          <Input label="Location" value={profile.location} onChange={(e) => patch({ location: e.target.value })} />
          <Input label="GST Number" value={profile.gstNumber} onChange={(e) => patch({ gstNumber: e.target.value })} />
        </div>

        {/* Hiring Status */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-text-primary text-lg">Hiring Status</h2>
            <AriaSwitch
              checked={profile.isHiring}
              onClick={() => patch({ isHiring: !profile.isHiring })}
              aria-label="Currently hiring"
              className={cn(
                'relative w-11 h-6 rounded-full transition-all duration-200',
                profile.isHiring ? 'bg-accent-green' : 'bg-[rgba(255,255,255,0.1)]'
              )}
            >
              <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200', profile.isHiring && 'translate-x-5')} />
            </AriaSwitch>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">Hiring Type</label>
            <div className="flex flex-wrap gap-2">
              {HIRING_INTENTS.map((intent) => (
                <button
                  key={intent}
                  onClick={() => toggleArray('hiringIntents', intent)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs border transition-all capitalize',
                    profile.hiringIntents.includes(intent)
                      ? 'bg-[rgba(123,94,167,0.1)] text-accent-violet border-[rgba(123,94,167,0.3)]'
                      : 'border-[rgba(255,255,255,0.06)] text-text-muted hover:border-[rgba(255,255,255,0.15)]'
                  )}
                >
                  {intent.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">AI Requirements</label>
            <div className="flex flex-wrap gap-2">
              {AI_REQUIREMENTS.map((req) => (
                <button
                  key={req}
                  onClick={() => toggleArray('aiRequirements', req)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs border transition-all capitalize',
                    profile.aiRequirements.includes(req)
                      ? 'bg-[rgba(123,94,167,0.1)] text-accent-violet border-[rgba(123,94,167,0.3)]'
                      : 'border-[rgba(255,255,255,0.06)] text-text-muted hover:border-[rgba(255,255,255,0.15)]'
                  )}
                >
                  {req}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
