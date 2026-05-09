'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Step = 1 | 2 | 3;

const INDUSTRIES = ['AI/ML', 'FinTech', 'HealthTech', 'EdTech', 'E-Commerce', 'SaaS', 'Gaming', 'Other'];
const HIRING_INTENTS = ['full_time', 'freelance', 'project', 'bounty'] as const;
const AI_REQUIREMENTS = ['chatbots', 'automation', 'agents', 'data', 'vision', 'nlp', 'mlops'] as const;
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>(1);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    companyName: '',
    description: '',
    website: '',
    industry: '',
    size: '',
    location: '',
    gstNumber: '',
    hiringIntents: [] as string[],
    aiRequirements: [] as string[],
  });

  function patch(updates: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  function toggleArray(key: 'hiringIntents' | 'aiRequirements', value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  }

  async function handleFinish() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSaving(false);
    toast.success('Company profile created!');
    router.push('/company/dashboard');
  }

  const steps = [
    { n: 1, label: 'Company Info' },
    { n: 2, label: 'Hiring Needs' },
    { n: 3, label: 'Review' },
  ];

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-accent-violet flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#080B14" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="2" fill="#080B14"/>
            </svg>
          </div>
          <span className="font-display font-bold text-text-primary text-lg">NeuronHire</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all',
                  step >= s.n
                    ? 'bg-accent-violet text-white'
                    : 'bg-[rgba(255,255,255,0.06)] text-text-muted'
                )}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span className={cn('text-xs hidden sm:block', step >= s.n ? 'text-text-secondary' : 'text-text-muted')}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('flex-1 h-px max-w-[40px]', step > s.n ? 'bg-accent-violet' : 'bg-[rgba(255,255,255,0.06)]')} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Company Info */}
        {step === 1 && (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5 animate-fade-up">
            <div>
              <h1 className="font-display text-2xl font-bold text-text-primary">Tell us about your company</h1>
              <p className="text-text-secondary text-sm mt-1">This helps engineers understand who they&apos;re working with</p>
            </div>

            <Input label="Company Name *" value={form.companyName} onChange={(e) => patch({ companyName: e.target.value })} />
            <Input label="Website" type="url" value={form.website} onChange={(e) => patch({ website: e.target.value })} />
            <Input label="Location" value={form.location} onChange={(e) => patch({ location: e.target.value })} />

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Industry</label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => patch({ industry: ind })}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs border transition-all',
                      form.industry === ind
                        ? 'bg-[rgba(123,94,167,0.1)] text-accent-violet border-[rgba(123,94,167,0.3)]'
                        : 'border-[rgba(255,255,255,0.06)] text-text-muted hover:border-[rgba(255,255,255,0.15)]'
                    )}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Company Size</label>
              <div className="flex flex-wrap gap-2">
                {COMPANY_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => patch({ size })}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs border transition-all',
                      form.size === size
                        ? 'bg-[rgba(123,94,167,0.1)] text-accent-violet border-[rgba(123,94,167,0.3)]'
                        : 'border-[rgba(255,255,255,0.06)] text-text-muted hover:border-[rgba(255,255,255,0.15)]'
                    )}
                  >
                    {size} employees
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">About Your Company</label>
              <textarea
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
                rows={3}
                placeholder="What does your company do? What AI problems are you solving?"
                className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(123,94,167,0.4)] resize-none transition-all"
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!form.companyName.trim()}
              onClick={() => setStep(2)}
            >
              Continue →
            </Button>
          </div>
        )}

        {/* Step 2: Hiring Needs */}
        {step === 2 && (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-6 animate-fade-up">
            <div>
              <h1 className="font-display text-2xl font-bold text-text-primary">What are you hiring for?</h1>
              <p className="text-text-secondary text-sm mt-1">Help us match you with the right engineers</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-3">Hiring Type (select all that apply)</label>
              <div className="grid grid-cols-2 gap-2">
                {HIRING_INTENTS.map((intent) => (
                  <button
                    key={intent}
                    onClick={() => toggleArray('hiringIntents', intent)}
                    className={cn(
                      'p-3 rounded-xl text-left border transition-all',
                      form.hiringIntents.includes(intent)
                        ? 'bg-[rgba(123,94,167,0.1)] border-[rgba(123,94,167,0.3)] text-accent-violet'
                        : 'border-[rgba(255,255,255,0.06)] text-text-muted hover:border-[rgba(255,255,255,0.15)]'
                    )}
                  >
                    <p className="text-sm font-medium capitalize">{intent.replace('_', ' ')}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-3">AI Requirements (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {AI_REQUIREMENTS.map((req) => (
                  <button
                    key={req}
                    onClick={() => toggleArray('aiRequirements', req)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs border transition-all capitalize',
                      form.aiRequirements.includes(req)
                        ? 'bg-[rgba(123,94,167,0.1)] text-accent-violet border-[rgba(123,94,167,0.3)]'
                        : 'border-[rgba(255,255,255,0.06)] text-text-muted hover:border-[rgba(255,255,255,0.15)]'
                    )}
                  >
                    {req}
                  </button>
                ))}
              </div>
            </div>

            <Input label="GST Number (optional)" value={form.gstNumber} onChange={(e) => patch({ gstNumber: e.target.value })} hint="Required for GST-compliant invoices" />

            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep(1)}>← Back</Button>
              <Button className="flex-1" size="lg" onClick={() => setStep(3)}>Continue →</Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5 animate-fade-up">
            <div>
              <h1 className="font-display text-2xl font-bold text-text-primary">Review & Launch</h1>
              <p className="text-text-secondary text-sm mt-1">Confirm your company profile details</p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Company', value: form.companyName || '—' },
                { label: 'Industry', value: form.industry || '—' },
                { label: 'Size', value: form.size ? `${form.size} employees` : '—' },
                { label: 'Location', value: form.location || '—' },
                { label: 'Hiring for', value: form.hiringIntents.join(', ') || '—' },
                { label: 'AI needs', value: form.aiRequirements.join(', ') || '—' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
                  <span className="text-xs text-text-muted">{item.label}</span>
                  <span className="text-sm text-text-primary capitalize">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep(2)}>← Back</Button>
              <Button className="flex-1" size="lg" loading={saving} onClick={handleFinish}>
                Launch Profile 🚀
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
