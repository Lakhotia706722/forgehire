'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MOCK_COMPANY = {
  companyName: 'Sarvam AI',
  description: 'Building India\'s most advanced multilingual AI platform for voice and text.',
  website: 'https://sarvam.ai',
  location: 'Bangalore, India',
  industry: 'AI/ML',
  size: '51-200',
  gstNumber: '29ABCDE1234F1Z5',
  isHiring: true,
  hiringIntents: ['full_time', 'project'],
  aiRequirements: ['nlp', 'agents', 'mlops'],
};

const HIRING_INTENTS = ['full_time', 'freelance', 'project', 'bounty'] as const;
const AI_REQUIREMENTS = ['chatbots', 'automation', 'agents', 'data', 'vision', 'nlp', 'mlops'] as const;

export default function CompanyProfilePage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [profile, setProfile] = React.useState(MOCK_COMPANY);
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  function patch(updates: Partial<typeof MOCK_COMPANY>) {
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
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setIsDirty(false);
    toast.success('Company profile saved');
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

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">Company Profile</h1>
            <p className="text-text-secondary text-sm mt-1">Manage your public company profile</p>
          </div>
          <Button size="md" loading={saving} disabled={!isDirty} onClick={handleSave}>
            Save Changes
          </Button>
        </div>

        {/* Basic Info */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-text-primary text-lg">Company Information</h2>
          <Input label="Company Name" value={profile.companyName} onChange={(e) => patch({ companyName: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
            <textarea
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
            <button
              onClick={() => patch({ isHiring: !profile.isHiring })}
              role="switch"
              aria-checked={profile.isHiring}
              className={cn(
                'relative w-11 h-6 rounded-full transition-all duration-200',
                profile.isHiring ? 'bg-accent-green' : 'bg-[rgba(255,255,255,0.1)]'
              )}
            >
              <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200', profile.isHiring && 'translate-x-5')} />
            </button>
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
