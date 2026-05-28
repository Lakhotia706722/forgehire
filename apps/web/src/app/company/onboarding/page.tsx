'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-fetch';

type Step = 1 | 2 | 3 | 4 | 5;

const INDUSTRIES = ['SaaS', 'Fintech', 'Healthcare', 'EdTech', 'eCommerce', 'Other'];
const HIRING_INTENTS = ['full_time', 'internship', 'hourly', 'project', 'bounty'] as const;
const AI_REQUIREMENTS = [
  'chatbots',
  'automation',
  'agents',
  'data',
  'vision',
  'nlp',
  'mlops',
  'fine_tuning',
  'rag',
] as const;
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '200+'];
const BUDGET_RANGES = ['under_1l', '1l_10l', '10l_1cr', 'above_1cr'] as const;
const PAYMENT_PREFS = ['fixed', 'hourly', 'both'] as const;
const BILLING_METHODS = ['card', 'upi', 'neft'] as const;

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>(1);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    companyName: '',
    logo: '',
    website: '',
    industry: '',
    companySize: '',
    foundedYear: new Date().getFullYear().toString(),
    description: '',
    contactName: '',
    contactRole: '',
    contactPhone: '',
    contactEmail: '',
    hiringIntents: [] as string[],
    aiRequirements: [] as string[],
    budgetRange: '' as '' | (typeof BUDGET_RANGES)[number],
    preferredPayment: '' as '' | (typeof PAYMENT_PREFS)[number],
    billingMethod: '' as '' | (typeof BILLING_METHODS)[number],
    gstNumber: '',
    linkedinCompanyPage: '',
    domainToVerify: '',
    domainVerified: false,
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

  async function saveCurrentStep(): Promise<void> {
    if (step === 1) {
      await apiFetch('/api/company/profile/basic', {
        method: 'PUT',
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          logo: form.logo || null,
          website: form.website || null,
          industry: form.industry,
          companySize: form.companySize,
          foundedYear: Number(form.foundedYear),
          description: form.description.trim(),
        }),
      });
      return;
    }
    if (step === 2) {
      await apiFetch('/api/company/profile/contact', {
        method: 'PUT',
        body: JSON.stringify({
          contactName: form.contactName.trim(),
          contactRole: form.contactRole.trim(),
          contactPhone: form.contactPhone.trim(),
          contactEmail: form.contactEmail.trim(),
        }),
      });
      return;
    }
    if (step === 3) {
      await apiFetch('/api/company/profile/intent', {
        method: 'PUT',
        body: JSON.stringify({
          hiringIntent: form.hiringIntents,
          primaryAIDomains: form.aiRequirements,
        }),
      });
      return;
    }
    if (step === 4) {
      await apiFetch('/api/company/profile/budget', {
        method: 'PUT',
        body: JSON.stringify({
          budgetRange: form.budgetRange,
          preferredPayment: form.preferredPayment,
          billingMethod: form.billingMethod,
        }),
      });
      return;
    }
    await apiFetch('/api/company/profile/complete', {
      method: 'POST',
      body: JSON.stringify({
        gstNumber: form.gstNumber || null,
        linkedinCompanyPage: form.linkedinCompanyPage || null,
      }),
    });
  }

  async function handleNext() {
    setSaving(true);
    try {
      await saveCurrentStep();
      if (step < 5) {
        setStep((prev) => (prev + 1) as Step);
      } else {
        toast.success('Company profile created!');
        router.push('/company/dashboard');
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save step. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleVerifyDomain() {
    if (!form.domainToVerify.trim()) return;
    try {
      const response = await apiFetch<{ verified: boolean }>(
        '/api/company/verify-domain?domain=' +
          encodeURIComponent(form.domainToVerify.trim()),
      );
      patch({ domainVerified: Boolean(response.verified) });
      toast.success(response.verified ? 'Domain verified' : 'Domain not verified yet');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    }
  }

  function canContinue(): boolean {
    if (step === 1) {
      return Boolean(
        form.companyName.trim() &&
          form.industry &&
          form.companySize &&
          form.foundedYear &&
          form.description.trim().length >= 10,
      );
    }
    if (step === 2) {
      return Boolean(
        form.contactName.trim() &&
          form.contactRole.trim() &&
          form.contactPhone.trim() &&
          form.contactEmail.trim(),
      );
    }
    if (step === 3) return form.hiringIntents.length > 0 && form.aiRequirements.length > 0;
    if (step === 4) return Boolean(form.budgetRange && form.preferredPayment && form.billingMethod);
    return true;
  }

  const steps = [
    { n: 1, label: 'Company Info' },
    { n: 2, label: 'Contact' },
    { n: 3, label: 'Intent' },
    { n: 4, label: 'Budget' },
    { n: 5, label: 'Verify' },
  ];

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-accent-violet flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z"
                stroke="#080B14"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="8" cy="8" r="2" fill="#080B14" />
            </svg>
          </div>
          <span className="font-display font-bold text-text-primary text-lg">NeuronHire</span>
        </div>

        <div className="flex items-center gap-2 mb-8 justify-center">
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all',
                    step >= s.n
                      ? 'bg-accent-violet text-white'
                      : 'bg-[rgba(255,255,255,0.06)] text-text-muted',
                  )}
                >
                  {step > s.n ? '✓' : s.n}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-px max-w-[40px]',
                    step > s.n ? 'bg-accent-violet' : 'bg-[rgba(255,255,255,0.06)]',
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5 animate-fade-up">
            <h1 className="font-display text-2xl font-bold text-text-primary">Company Info</h1>
            <Input label="Company Name *" value={form.companyName} onChange={(e) => patch({ companyName: e.target.value })} />
            <Input label="Logo URL" type="url" value={form.logo} onChange={(e) => patch({ logo: e.target.value })} />
            <Input label="Website" type="url" value={form.website} onChange={(e) => patch({ website: e.target.value })} />
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((ind) => (
                <button key={ind} onClick={() => patch({ industry: ind })} className={cn('px-3 py-1.5 rounded-lg text-xs border transition-all', form.industry === ind ? 'bg-[rgba(123,94,167,0.1)] text-accent-violet border-[rgba(123,94,167,0.3)]' : 'border-[rgba(255,255,255,0.06)] text-text-muted')}>
                  {ind}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {COMPANY_SIZES.map((size) => (
                <button key={size} onClick={() => patch({ companySize: size })} className={cn('px-3 py-1.5 rounded-lg text-xs border transition-all', form.companySize === size ? 'bg-[rgba(123,94,167,0.1)] text-accent-violet border-[rgba(123,94,167,0.3)]' : 'border-[rgba(255,255,255,0.06)] text-text-muted')}>
                  {size}
                </button>
              ))}
            </div>
            <Input label="Founded Year" type="number" value={form.foundedYear} onChange={(e) => patch({ foundedYear: e.target.value })} />
            <textarea value={form.description} onChange={(e) => patch({ description: e.target.value })} rows={3} placeholder="About your company..." className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(123,94,167,0.4)] resize-none transition-all" />
            <Button className="w-full" size="lg" loading={saving} disabled={!canContinue()} onClick={handleNext}>Continue →</Button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5 animate-fade-up">
            <h1 className="font-display text-2xl font-bold text-text-primary">Contact Person</h1>
            <Input label="Contact Name" value={form.contactName} onChange={(e) => patch({ contactName: e.target.value })} />
            <Input label="Contact Role" value={form.contactRole} onChange={(e) => patch({ contactRole: e.target.value })} />
            <Input label="Contact Phone" value={form.contactPhone} onChange={(e) => patch({ contactPhone: e.target.value })} />
            <Input label="Contact Email" type="email" value={form.contactEmail} onChange={(e) => patch({ contactEmail: e.target.value })} />
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep(1)}>← Back</Button>
              <Button className="flex-1" size="lg" loading={saving} disabled={!canContinue()} onClick={handleNext}>Continue →</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-6 animate-fade-up">
            <h1 className="font-display text-2xl font-bold text-text-primary">Hiring Intent</h1>
            <div className="grid grid-cols-2 gap-2">
              {HIRING_INTENTS.map((intent) => (
                <button key={intent} onClick={() => toggleArray('hiringIntents', intent)} className={cn('p-3 rounded-xl text-left border transition-all', form.hiringIntents.includes(intent) ? 'bg-[rgba(123,94,167,0.1)] border-[rgba(123,94,167,0.3)] text-accent-violet' : 'border-[rgba(255,255,255,0.06)] text-text-muted')}>
                  <p className="text-sm font-medium capitalize">{intent.replace('_', ' ')}</p>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {AI_REQUIREMENTS.map((req) => (
                <button key={req} onClick={() => toggleArray('aiRequirements', req)} className={cn('px-3 py-1.5 rounded-lg text-xs border transition-all capitalize', form.aiRequirements.includes(req) ? 'bg-[rgba(123,94,167,0.1)] text-accent-violet border-[rgba(123,94,167,0.3)]' : 'border-[rgba(255,255,255,0.06)] text-text-muted')}>
                  {req}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep(2)}>← Back</Button>
              <Button className="flex-1" size="lg" loading={saving} disabled={!canContinue()} onClick={handleNext}>Continue →</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5 animate-fade-up">
            <h1 className="font-display text-2xl font-bold text-text-primary">Budget & Payment</h1>
            <div className="grid grid-cols-2 gap-2">
              {BUDGET_RANGES.map((value) => (
                <button key={value} onClick={() => patch({ budgetRange: value })} className={cn('p-2 rounded-lg border text-xs transition-all', form.budgetRange === value ? 'bg-[rgba(123,94,167,0.1)] text-accent-violet border-[rgba(123,94,167,0.3)]' : 'border-[rgba(255,255,255,0.06)] text-text-muted')}>
                  {value.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {PAYMENT_PREFS.map((value) => (
                <button key={value} onClick={() => patch({ preferredPayment: value })} className={cn('px-3 py-2 rounded-lg border text-xs transition-all', form.preferredPayment === value ? 'bg-[rgba(123,94,167,0.1)] text-accent-violet border-[rgba(123,94,167,0.3)]' : 'border-[rgba(255,255,255,0.06)] text-text-muted')}>
                  {value}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {BILLING_METHODS.map((value) => (
                <button key={value} onClick={() => patch({ billingMethod: value })} className={cn('px-3 py-2 rounded-lg border text-xs transition-all uppercase', form.billingMethod === value ? 'bg-[rgba(123,94,167,0.1)] text-accent-violet border-[rgba(123,94,167,0.3)]' : 'border-[rgba(255,255,255,0.06)] text-text-muted')}>
                  {value}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep(3)}>← Back</Button>
              <Button className="flex-1" size="lg" loading={saving} disabled={!canContinue()} onClick={handleNext}>Continue →</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5 animate-fade-up">
            <h1 className="font-display text-2xl font-bold text-text-primary">Verification</h1>
            <Input label="GST Number (optional)" value={form.gstNumber} onChange={(e) => patch({ gstNumber: e.target.value })} />
            <Input label="LinkedIn Company Page (optional)" type="url" value={form.linkedinCompanyPage} onChange={(e) => patch({ linkedinCompanyPage: e.target.value })} />
            <Input label="Domain to verify" value={form.domainToVerify} onChange={(e) => patch({ domainToVerify: e.target.value, domainVerified: false })} />
            <Button variant="secondary" size="sm" onClick={handleVerifyDomain}>Verify Now</Button>
            {form.domainVerified && <p className="text-xs text-accent-green">Domain verified</p>}
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep(4)}>← Back</Button>
              <Button className="flex-1" size="lg" loading={saving} onClick={handleNext}>Launch Profile 🚀</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
