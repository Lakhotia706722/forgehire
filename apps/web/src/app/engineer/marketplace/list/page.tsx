'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { LISTING_CATEGORIES, type ProductCategory, type PricingModel } from '@/lib/marketplace-data';
import { apiFetch } from '@/lib/api-fetch';
import { toast } from 'sonner';

interface ListingState {
  category: ProductCategory | null;
  name: string;
  tagline: string;
  tags: string[];
  description: string;
  useCases: string[];
  whoItsFor: string;
  thumbnailUrl: string;
  screenshots: string[];
  videoUrl: string;
  techStack: string[];
  aiModel: string;
  architectureType: string;
  hostingRequirements: string[];
  apiDependencies: string[];
  pricingModel: PricingModel | null;
  priceINR: string;
  deliveryType: string[];
  customizationAvailable: boolean;
  customizationPrice: string;
  supportType: string;
  supportDuration: string;
}

const DEFAULT_STATE: ListingState = {
  category: null, name: '', tagline: '', tags: [],
  description: '', useCases: [''], whoItsFor: '',
  thumbnailUrl: '', screenshots: [], videoUrl: '',
  techStack: [], aiModel: '', architectureType: '',
  hostingRequirements: [], apiDependencies: [],
  pricingModel: null, priceINR: '',
  deliveryType: [], customizationAvailable: false, customizationPrice: '',
  supportType: '', supportDuration: '',
};

const STEPS = [
  { num: 1, label: 'Category & Basics' },
  { num: 2, label: 'Description' },
  { num: 3, label: 'Media' },
  { num: 4, label: 'Technical' },
  { num: 5, label: 'Pricing' },
  { num: 6, label: 'Delivery & Support' },
  { num: 7, label: 'Preview & Publish' },
];

const PRICING_MODELS: { value: PricingModel; label: string; desc: string; icon: string }[] = [
  { value: 'one_time',     label: 'One-time',     desc: 'Customer pays once, owns forever', icon: '💳' },
  { value: 'subscription', label: 'Subscription', desc: 'Recurring monthly or annual fee',  icon: '🔄' },
  { value: 'freemium',     label: 'Freemium',     desc: 'Free tier + paid upgrades',        icon: '🆓' },
  { value: 'per_call',     label: 'Per-call',     desc: 'Pay per API call or usage',        icon: '⚡' },
];

const CATEGORY_TO_API: Record<ProductCategory, 'ai_agents' | 'fine_tuned_models' | 'saas_tools' | 'automation_workflows' | 'datasets_prompts' | 'apis_microservices'> = {
  'AI Agents': 'ai_agents',
  'Fine-Tuned Models': 'fine_tuned_models',
  'SaaS Tools': 'saas_tools',
  Automation: 'automation_workflows',
  'Datasets & Prompts': 'datasets_prompts',
  APIs: 'apis_microservices',
};

export default function ListProductPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [state, setState] = React.useState<ListingState>(DEFAULT_STATE);
  const [animating, setAnimating] = React.useState(false);
  const [direction, setDirection] = React.useState<'forward' | 'back'>('forward');
  const [tagInput, setTagInput] = React.useState('');
  const [techInput, setTechInput] = React.useState('');
  const [screenshotInput, setScreenshotInput] = React.useState('');
  const [published, setPublished] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

  function patch(update: Partial<ListingState>) {
    setState((prev) => ({ ...prev, ...update }));
  }

  function goTo(next: number, dir: 'forward' | 'back' = 'forward') {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 280);
  }

  function addTag(t: string) {
    if (!t.trim() || state.tags.includes(t.trim())) return;
    patch({ tags: [...state.tags, t.trim()] });
    setTagInput('');
  }

  function addTech(t: string) {
    if (!t.trim() || state.techStack.includes(t.trim())) return;
    patch({ techStack: [...state.techStack, t.trim()] });
    setTechInput('');
  }

  function canNext(): boolean {
    if (step === 1) return !!(state.category && state.name && state.tagline);
    if (step === 2) return !!(state.description);
    if (step === 5) return !!(state.pricingModel);
    return true;
  }

  async function handlePublish() {
    if (publishing || !state.category || !state.pricingModel) return;
    if (!state.thumbnailUrl || state.screenshots.length < 3) {
      toast.error('Add a thumbnail URL and at least 3 screenshot URLs.');
      return;
    }
    if (!state.videoUrl) {
      toast.error('Demo URL is required before publishing.');
      return;
    }

    const description = state.description.trim();
    if (description.length < 100) {
      toast.error('Description must be at least 100 characters.');
      return;
    }

    setPublishing(true);
    try {
      const created = await apiFetch<{ id: string }>('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name: state.name.trim(),
          tagline: state.tagline.trim(),
          category: CATEGORY_TO_API[state.category],
          tags: state.tags,
          thumbnailUrl: state.thumbnailUrl,
          description,
          demoUrl: state.videoUrl,
          screenshots: state.screenshots,
          techStack: state.techStack,
          aiModelUsed: state.aiModel || null,
          architectureType: state.architectureType || null,
          pricingModel: state.pricingModel,
          priceINR: state.pricingModel === 'freemium' ? 100 : Number(state.priceINR || 100),
          priceUSD: null,
          features: state.useCases.filter(Boolean).map((uc, i) => ({
            title: `Use case ${i + 1}`,
            description: uc,
            included: true,
          })),
          performanceMetrics: null,
          deliveryType: state.deliveryType.join(', ') || 'digital_download',
          customizationAvailable: state.customizationAvailable,
          supportType: state.supportType || null,
          supportDuration: state.supportDuration || null,
        }),
      });

      await apiFetch(`/api/products/${created.id}/publish`, { method: 'POST' });
      setPublished(true);
      toast.success('Product submitted for moderation review.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to publish product.';
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  }

  if (published) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Product Published!</h1>
          <p className="text-text-secondary text-sm">Your product is now live on the marketplace and under moderation review.</p>
          <Button size="md" onClick={() => router.push('/engineer/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-[rgba(255,255,255,0.06)] bg-bg-surface min-h-screen sticky top-0 h-screen overflow-y-auto">
        <div className="px-5 py-5 border-b border-[rgba(255,255,255,0.06)]">
          <p className="font-display font-bold text-text-primary text-base">List a Product</p>
          <p className="text-xs text-text-muted mt-0.5">Step {step} of {STEPS.length}</p>
        </div>
        <nav className="flex-1 px-4 py-5 space-y-1">
          {STEPS.map((s) => {
            const done = s.num < step;
            const active = s.num === step;
            return (
              <div key={s.num} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg', active && 'bg-[rgba(0,212,255,0.06)]', s.num > step && 'opacity-40')}>
                <div className="shrink-0">
                  {done ? (
                    <div className="w-6 h-6 rounded-full bg-accent-cyan flex items-center justify-center">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true"><path d="M1 4L3.5 6.5L9 1" stroke="#080B14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  ) : active ? (
                    <div className="w-6 h-6 rounded-full border-2 border-accent-cyan flex items-center justify-center animate-pulse-ring">
                      <div className="w-2 h-2 rounded-full bg-accent-cyan" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-[rgba(255,255,255,0.15)] flex items-center justify-center">
                      <span className="text-[10px] font-mono text-text-muted">{s.num}</span>
                    </div>
                  )}
                </div>
                <p className={cn('text-sm font-medium', active ? 'text-text-primary' : done ? 'text-text-secondary' : 'text-text-muted')}>{s.label}</p>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 md:px-12 md:py-12">
        <div className="w-full max-w-[600px]">
          <div className={cn('transition-all duration-[280ms]', animating ? (direction === 'forward' ? 'opacity-0 -translate-x-4' : 'opacity-0 translate-x-4') : 'opacity-100 translate-x-0')}>

            {/* Step 1 — Category & Basics */}
            {step === 1 && (
              <div className="space-y-6">
                <div><h2 className="font-display text-2xl font-bold text-text-primary mb-1">Category & Basics</h2><p className="text-text-secondary text-sm">What type of AI product are you listing?</p></div>
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Product category">
                  {LISTING_CATEGORIES.map((cat) => (
                    <button key={cat.id} type="button" role="radio" aria-checked={state.category === cat.id ? "true" : "false"}
                      onClick={() => patch({ category: cat.id })}
                      className={cn('text-left p-4 rounded-xl border-2 transition-all duration-150 hover:-translate-y-0.5',
                        state.category === cat.id ? 'border-[rgba(0,212,255,0.5)] bg-[rgba(0,212,255,0.06)]' : 'border-[rgba(255,255,255,0.06)] bg-bg-surface hover:border-[rgba(255,255,255,0.15)]'
                      )}>
                      <span className="text-2xl block mb-2" aria-hidden="true">{cat.icon}</span>
                      <p className="text-sm font-semibold text-text-primary">{cat.id}</p>
                      <p className="text-xs text-text-muted mt-0.5">{cat.description}</p>
                    </button>
                  ))}
                </div>
                <Input label="Product Name *" value={state.name} onChange={(e) => patch({ name: e.target.value })} />
                <Input label="Tagline *" value={state.tagline} onChange={(e) => patch({ tagline: e.target.value })} hint="One sentence that sells your product" />
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Tags</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {state.tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-[rgba(0,212,255,0.08)] text-accent-cyan border border-[rgba(0,212,255,0.2)]">
                        {t}<button onClick={() => patch({ tags: state.tags.filter((x) => x !== t) })} aria-label={`Remove ${t}`} className="hover:text-accent-red">×</button>
                      </span>
                    ))}
                  </div>
                  <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }} placeholder="Add tag (press Enter)" className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]" />
                </div>
              </div>
            )}

            {/* Step 2 — Description */}
            {step === 2 && (
              <div className="space-y-6">
                <div><h2 className="font-display text-2xl font-bold text-text-primary mb-1">Description</h2><p className="text-text-secondary text-sm">Tell buyers what your product does and who it&apos;s for.</p></div>
                <div><label className="block text-sm font-medium text-text-secondary mb-2">Product Description *</label><RichTextEditor value={state.description} onChange={(v) => patch({ description: v })} placeholder="Describe your product in detail..." minHeight={160} /></div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Use Cases</label>
                  <div className="space-y-2">
                    {state.useCases.map((uc, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={uc} onChange={(e) => { const u = [...state.useCases]; u[i] = e.target.value; patch({ useCases: u }); }} placeholder={`Use case ${i + 1}`} className="flex-1 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]" />
                        {state.useCases.length > 1 && <button onClick={() => patch({ useCases: state.useCases.filter((_, j) => j !== i) })} className="text-text-muted hover:text-accent-red transition-colors" aria-label="Remove use case">×</button>}
                      </div>
                    ))}
                    <button onClick={() => patch({ useCases: [...state.useCases, ''] })} className="text-xs text-accent-cyan hover:underline">+ Add use case</button>
                  </div>
                </div>
                <div><label className="block text-sm font-medium text-text-secondary mb-2">Who It&apos;s For</label><textarea value={state.whoItsFor} onChange={(e) => patch({ whoItsFor: e.target.value })} rows={2} placeholder="Describe your ideal customer..." className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none" /></div>
              </div>
            )}

            {/* Step 3 — Media */}
            {step === 3 && (
              <div className="space-y-6">
                <div><h2 className="font-display text-2xl font-bold text-text-primary mb-1">Media</h2><p className="text-text-secondary text-sm">Add screenshots and a video to showcase your product.</p></div>
                <div className="border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-xl p-8 text-center cursor-pointer hover:border-[rgba(0,212,255,0.3)] transition-colors" role="button" tabIndex={0} aria-label="Upload thumbnail">
                  <p className="text-sm text-text-secondary">Drag & drop thumbnail or <span className="text-accent-cyan">browse</span></p>
                  <p className="text-xs text-text-muted mt-1">16:9 ratio recommended · PNG, JPG, WebP</p>
                </div>
                <Input
                  label="Thumbnail URL *"
                  value={state.thumbnailUrl}
                  onChange={(e) => patch({ thumbnailUrl: e.target.value })}
                  type="url"
                />
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Screenshots <span className="text-text-muted">(min 3, max 10)</span></label>
                  <div className="border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-xl p-6 text-center cursor-pointer hover:border-[rgba(0,212,255,0.3)] transition-colors" role="button" tabIndex={0} aria-label="Upload screenshots" data-testid="screenshot-uploader">
                    <p className="text-sm text-text-secondary">Upload screenshots</p>
                    <p className="text-xs text-text-muted mt-1">Drag to reorder after upload</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={screenshotInput}
                      onChange={(e) => setScreenshotInput(e.target.value)}
                      placeholder="Paste screenshot URL and press Add"
                      className="flex-1 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        const value = screenshotInput.trim();
                        if (!value || state.screenshots.includes(value) || state.screenshots.length >= 10) return;
                        patch({ screenshots: [...state.screenshots, value] });
                        setScreenshotInput('');
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {state.screenshots.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {state.screenshots.map((url) => (
                        <div key={url} className="flex items-center justify-between text-xs text-text-secondary bg-bg-surface rounded-md px-2 py-1">
                          <span className="truncate pr-2">{url}</span>
                          <button
                            type="button"
                            onClick={() => patch({ screenshots: state.screenshots.filter((u) => u !== url) })}
                            className="text-text-muted hover:text-accent-red"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Input label="Demo URL (required) *" value={state.videoUrl} onChange={(e) => patch({ videoUrl: e.target.value })} type="url" />
              </div>
            )}

            {/* Step 4 — Technical */}
            {step === 4 && (
              <div className="space-y-6">
                <div><h2 className="font-display text-2xl font-bold text-text-primary mb-1">Technical Details</h2><p className="text-text-secondary text-sm">Help buyers understand what&apos;s under the hood.</p></div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Tech Stack</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {state.techStack.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-[rgba(0,212,255,0.08)] text-accent-cyan border border-[rgba(0,212,255,0.2)]">
                        {t}<button onClick={() => patch({ techStack: state.techStack.filter((x) => x !== t) })} aria-label={`Remove ${t}`} className="hover:text-accent-red">×</button>
                      </span>
                    ))}
                  </div>
                  <input value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(techInput); } }} placeholder="Add tech (press Enter)" className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]" />
                </div>
                <Input label="AI Model Used" value={state.aiModel} onChange={(e) => patch({ aiModel: e.target.value })} placeholder=" " hint="e.g. GPT-4, Claude 3.5, LLaMA 3, Custom" />
                <Input label="Architecture Type" value={state.architectureType} onChange={(e) => patch({ architectureType: e.target.value })} placeholder=" " hint="e.g. RAG pipeline, Multi-agent, Fine-tuned transformer" />
              </div>
            )}

            {/* Step 5 — Pricing */}
            {step === 5 && (
              <div className="space-y-6">
                <div><h2 className="font-display text-2xl font-bold text-text-primary mb-1">Pricing</h2><p className="text-text-secondary text-sm">Choose how you want to monetise your product.</p></div>
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Pricing model">
                  {PRICING_MODELS.map((pm) => (
                    <button key={pm.value} type="button" role="radio" aria-checked={state.pricingModel === pm.value ? "true" : "false"}
                      onClick={() => patch({ pricingModel: pm.value })}
                      className={cn('text-left p-4 rounded-xl border-2 transition-all duration-150',
                        state.pricingModel === pm.value ? 'border-[rgba(0,212,255,0.5)] bg-[rgba(0,212,255,0.06)]' : 'border-[rgba(255,255,255,0.06)] bg-bg-surface hover:border-[rgba(255,255,255,0.15)]'
                      )}>
                      <span className="text-2xl block mb-2" aria-hidden="true">{pm.icon}</span>
                      <p className="text-sm font-semibold text-text-primary">{pm.label}</p>
                      <p className="text-xs text-text-muted mt-0.5">{pm.desc}</p>
                    </button>
                  ))}
                </div>
                {state.pricingModel && state.pricingModel !== 'freemium' && (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-text-muted pointer-events-none">₹</span>
                    <input type="number" value={state.priceINR} onChange={(e) => patch({ priceINR: e.target.value })} placeholder="0" min="0" className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl pl-10 pr-4 py-3 font-mono text-xl text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-all" aria-label="Price in rupees" />
                  </div>
                )}
              </div>
            )}

            {/* Step 6 — Delivery & Support */}
            {step === 6 && (
              <div className="space-y-6">
                <div><h2 className="font-display text-2xl font-bold text-text-primary mb-1">Delivery & Support</h2><p className="text-text-secondary text-sm">Tell buyers what they get and how you&apos;ll support them.</p></div>
                <Input label="Support Type" value={state.supportType} onChange={(e) => patch({ supportType: e.target.value })} placeholder=" " hint="e.g. Email, Slack, GitHub Issues" />
                <Input label="Support Duration" value={state.supportDuration} onChange={(e) => patch({ supportDuration: e.target.value })} placeholder=" " hint="e.g. 6 months, 1 year, Lifetime" />
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn('relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer', state.customizationAvailable ? 'bg-accent-cyan' : 'bg-[rgba(255,255,255,0.1)]')}
                    onClick={() => patch({ customizationAvailable: !state.customizationAvailable })}
                    role="switch" aria-checked={state.customizationAvailable ? "true" : "false"} aria-label="Customization available" tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && patch({ customizationAvailable: !state.customizationAvailable })}>
                    <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200', state.customizationAvailable ? 'translate-x-5' : 'translate-x-0.5')} />
                  </div>
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Offer customization</span>
                </label>
                {state.customizationAvailable && (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-text-muted pointer-events-none">₹</span>
                    <input type="number" value={state.customizationPrice} onChange={(e) => patch({ customizationPrice: e.target.value })} placeholder="Starting price" className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg pl-10 pr-4 py-2.5 font-mono text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)]" aria-label="Customization starting price" />
                  </div>
                )}
              </div>
            )}

            {/* Step 7 — Preview & Publish */}
            {step === 7 && (
              <div className="space-y-6">
                <div><h2 className="font-display text-2xl font-bold text-text-primary mb-1">Preview & Publish</h2><p className="text-text-secondary text-sm">Review how your product will appear to buyers.</p></div>
                <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden" data-testid="product-preview">
                  <div className={`h-40 bg-gradient-to-br from-[rgba(0,212,255,0.15)] to-[rgba(123,94,167,0.1)]`} aria-hidden="true" />
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      {state.category && <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[rgba(0,212,255,0.1)] text-accent-cyan border border-[rgba(0,212,255,0.2)]">{state.category}</span>}
                    </div>
                    <h3 className="font-display font-bold text-text-primary text-lg">{state.name || 'Product Name'}</h3>
                    <p className="text-text-muted text-sm">{state.tagline || 'Your tagline here'}</p>
                    {state.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {state.tags.map((t) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] text-text-muted border border-[rgba(255,255,255,0.08)] font-mono">{t}</span>)}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.06)]">
                      <span className="font-mono font-bold text-text-primary">
                        {state.pricingModel === 'freemium' ? 'Free' : state.priceINR ? `₹${parseInt(state.priceINR).toLocaleString('en-IN')}` : '—'}
                      </span>
                      {state.pricingModel && <span className="text-xs text-text-muted">{state.pricingModel.replace('_', ' ')}</span>}
                    </div>
                  </div>
                </div>
                <Button size="lg" className="w-full" onClick={handlePublish} data-testid="publish-product-btn"
                  disabled={!state.category || !state.name || !state.pricingModel || publishing}>
                  {publishing ? 'Publishing...' : 'Publish to Marketplace'}
                </Button>
                <p className="text-xs text-text-muted text-center">Your product will be reviewed by our moderation team before going live (usually within 24 hours).</p>
              </div>
            )}

            {/* Navigation */}
            {step < 7 && (
              <div className="flex items-center justify-between pt-8 mt-8 border-t border-[rgba(255,255,255,0.06)]">
                {step > 1 ? (
                  <button onClick={() => goTo(step - 1, 'back')} className="text-sm text-text-muted hover:text-text-secondary transition-colors">← Back</button>
                ) : <div />}
                <button onClick={() => canNext() && goTo(step + 1, 'forward')} disabled={!canNext()}
                  className={cn('px-6 py-2.5 rounded-lg text-sm font-semibold transition-all', canNext() ? 'bg-accent-cyan text-bg-base hover:brightness-110 active:scale-[0.97]' : 'bg-[rgba(255,255,255,0.06)] text-text-muted cursor-not-allowed')}>
                  Continue →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
