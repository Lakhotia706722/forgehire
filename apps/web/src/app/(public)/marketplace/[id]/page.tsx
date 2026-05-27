'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { ScreenshotCarousel } from './_components/screenshot-carousel';
import { TryBeforeBuy } from './_components/try-before-buy';
import { PurchaseModal } from './_components/purchase-modal';
import { formatPrice, getPricingLabel, type ProductListing } from '@/lib/marketplace-data';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, apiFetchList } from '@/lib/api-fetch';
import { mapApiProductToListing } from '@/lib/map-api-product';
import { Skeleton } from '@/components/ui/skeleton';
import { avatarBgClass } from '@/lib/a11y';
import { AriaNavButton, AriaToggleButton } from '@/components/ui/aria-tab-button';

type DetailTab = 'overview' | 'technical' | 'features' | 'performance' | 'support';

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'overview',    label: 'Overview' },
  { id: 'technical',  label: 'Technical' },
  { id: 'features',   label: 'Features' },
  { id: 'performance',label: 'Performance' },
  { id: 'support',    label: 'Support' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1,2,3,4,5].map((s) => (
        <svg key={s} width="14" height="14" viewBox="0 0 12 12" fill={s <= Math.floor(rating) ? '#F59E0B' : 'rgba(255,255,255,0.1)'} aria-hidden="true">
          <path d="M6 1l1.39 2.82L10.5 4.27l-2.25 2.19.53 3.09L6 8.02 3.22 9.55l.53-3.09L1.5 4.27l3.11-.45L6 1z"/>
        </svg>
      ))}
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const {
    data: productFromApi,
    isLoading: productLoading,
    isError: productError,
  } = useQuery({
    queryKey: ['product', params.id],
    queryFn: async () => {
      const raw = await apiFetch<Record<string, unknown>>(`/api/products/${params.id}`);
      return mapApiProductToListing(raw);
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
  const { data: reviewsFromApi = [] } = useQuery({
    queryKey: ['product', params.id, 'reviews'],
    queryFn: () => apiFetchList<Record<string, unknown>>(`/api/products/${params.id}/reviews`),
    staleTime: 5 * 60_000,
    retry: false,
    enabled: !!productFromApi,
  });

  if (productLoading) {
    return (
      <div className="min-h-screen bg-bg-base max-w-7xl mx-auto px-6 py-8 space-y-6">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (productError || !productFromApi) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-xl font-bold text-text-primary mb-2">Product not found</h1>
          <Link href="/marketplace" className="text-sm text-accent-cyan hover:underline">
            ← Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  return <ProductDetailView product={productFromApi} reviewsFromApi={reviewsFromApi} />;
}

function ProductDetailView({
  product,
  reviewsFromApi,
}: {
  product: ProductListing;
  reviewsFromApi: Record<string, unknown>[];
}) {
  const reviews = reviewsFromApi.map((rev, i) => ({
    id: String(rev.id ?? i),
    productId: product.id,
    reviewerName: String(rev.reviewerName ?? rev.buyerName ?? 'Buyer'),
    reviewerInitials: String(rev.reviewerInitials ?? 'B'),
    reviewerCompany: String(rev.reviewerCompany ?? ''),
    rating: Number(rev.rating ?? 0),
    date: rev.createdAt
      ? new Date(String(rev.createdAt)).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '',
    text: String(rev.review ?? rev.text ?? ''),
    verified: Boolean(rev.verified ?? true),
  }));
  const displayReviews = reviews;
  const [activeTab, setActiveTab] = React.useState<DetailTab>('overview');
  const useCases = product.useCases ?? [];
  const features = product.features ?? [];
  const deliverables = product.deliverables ?? [];
  const techStack = product.techStack ?? [];
  const screenshots = product.screenshots ?? [];
  const hostingRequirements = product.hostingRequirements ?? [];
  const apiDependencies = product.apiDependencies ?? [];

  const [selectedTierId, setSelectedTierId] = React.useState(
    product.pricingTiers?.find((t) => t.highlighted)?.id ?? product.pricingTiers?.[0]?.id
  );
  const [showPurchase, setShowPurchase] = React.useState(false);
  const [wishlisted, setWishlisted] = React.useState(false);

  // Build carousel slides
  const slides = [
    ...(product.videoUrl ? [{ type: 'video' as const, url: product.videoUrl }] : []),
    ...screenshots.map((url) => ({ type: 'image' as const, url })),
    ...(!screenshots.length && !product.videoUrl
      ? [{ type: 'image' as const, url: '', alt: 'Product screenshot' }]
      : []),
  ];

  // Rating distribution (mock)
  const ratingDist = [
    { stars: 5, pct: 72 },
    { stars: 4, pct: 18 },
    { stars: 3, pct: 6 },
    { stars: 2, pct: 2 },
    { stars: 1, pct: 2 },
  ];

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Breadcrumb */}
      <div className="border-b border-[rgba(255,255,255,0.06)] bg-bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-xs text-text-muted">
          <Link href="/marketplace" className="hover:text-text-secondary transition-colors">Marketplace</Link>
          <span>/</span>
          <span className="text-text-muted">{product.category}</span>
          <span>/</span>
          <span className="text-text-secondary truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Left column ─────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Screenshot carousel */}
            <ScreenshotCarousel slides={slides} productName={product.name} />

            {/* Try before buy */}
            {product.hasTryBeforeBuy && (
              <TryBeforeBuy productName={product.name} demoUrl={product.demoUrl} />
            )}

            {/* Tab navigation */}
            <nav className="border-b border-[rgba(255,255,255,0.06)]" aria-label="Product details">
              <div className="flex gap-0 overflow-x-auto scrollbar-none">
                {TABS.map((tab) => (
                  <AriaNavButton
                    key={tab.id}
                    current={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative',
                      activeTab === tab.id ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan rounded-full" aria-hidden="true" />
                    )}
                  </AriaNavButton>
                ))}
              </div>
            </nav>

            {/* Tab content */}
            <div key={activeTab} className="animate-fade-up">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <p className="text-text-secondary text-sm leading-relaxed">{product.description}</p>
                  {product.problemSolved ? (
                    <div>
                      <h3 className="font-display font-semibold text-text-primary text-sm mb-2">Problem Solved</h3>
                      <p className="text-text-secondary text-sm leading-relaxed">{product.problemSolved}</p>
                    </div>
                  ) : null}
                  {useCases.length > 0 ? (
                    <div>
                      <h3 className="font-display font-semibold text-text-primary text-sm mb-2">Use Cases</h3>
                      <ul className="space-y-1.5">
                        {useCases.map((u, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                            <span className="text-accent-cyan" aria-hidden="true">·</span>{u}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {product.whoItsFor ? (
                    <div>
                      <h3 className="font-display font-semibold text-text-primary text-sm mb-2">Who It&apos;s For</h3>
                      <p className="text-text-secondary text-sm">{product.whoItsFor}</p>
                    </div>
                  ) : null}
                </div>
              )}

              {activeTab === 'technical' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display font-semibold text-text-primary text-sm mb-2">Tech Stack</h3>
                    {techStack.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {techStack.map((t) => <Badge key={t} variant="gray">{t}</Badge>)}
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted">Not specified</p>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div><p className="text-xs text-text-muted mb-0.5">AI Model</p><p className="text-text-primary font-mono">{product.aiModel}</p></div>
                    <div><p className="text-xs text-text-muted mb-0.5">Architecture</p><p className="text-text-primary">{product.architectureType || '—'}</p></div>
                  </div>
                  {hostingRequirements.length > 0 && (
                    <div>
                      <h3 className="font-display font-semibold text-text-primary text-sm mb-2">Hosting Requirements</h3>
                      <div className="flex flex-wrap gap-2">
                        {hostingRequirements.map((h) => <Badge key={h} variant="amber">{h}</Badge>)}
                      </div>
                    </div>
                  )}
                  {apiDependencies.length > 0 && (
                    <div>
                      <h3 className="font-display font-semibold text-text-primary text-sm mb-2">API Dependencies</h3>
                      <div className="flex flex-wrap gap-2">
                        {apiDependencies.map((a) => <Badge key={a} variant="violet">{a}</Badge>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'features' && (
                features.length > 0 ? (
                  <ul className="space-y-3">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-bg-elevated rounded-xl border border-[rgba(255,255,255,0.04)]">
                        <span className="text-xl shrink-0" aria-hidden="true">{f.icon}</span>
                        <span className="text-sm text-text-secondary">{f.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-text-muted">No features listed for this product.</p>
                )
              )}

              {activeTab === 'performance' && (
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Accuracy',      value: product.accuracy ? `${product.accuracy}%` : '—',    colorClass: 'text-accent-green' },
                    { label: 'Avg Response',  value: product.avgResponseMs ? `${product.avgResponseMs}ms` : '—', colorClass: 'text-accent-cyan' },
                    { label: 'Uptime',        value: product.uptime ? `${product.uptime}%` : '—',        colorClass: 'text-accent-amber' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl p-5 text-center">
                      <p className={cn('font-mono font-bold text-3xl leading-none mb-1', stat.colorClass)}>{stat.value}</p>
                      <p className="text-xs text-text-muted">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'support' && (
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Support Type',    value: product.supportType },
                    { label: 'Duration',         value: product.supportDuration },
                    { label: 'Response Time SLA',value: product.responseTimeSLA },
                    { label: 'Customization',    value: product.customizationAvailable ? `Available — ₹${product.customizationPrice?.toLocaleString('en-IN')} starting` : 'Not available' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-[rgba(255,255,255,0.04)]">
                      <span className="text-text-muted">{row.label}</span>
                      <span className="text-text-primary font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="space-y-5">
              <h2 className="font-display font-semibold text-text-primary text-lg">Reviews</h2>

              {/* Rating breakdown */}
              <div className="flex items-start gap-6 p-5 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl">
                <div className="text-center shrink-0">
                  <p className="font-display font-bold text-5xl text-text-primary">{product.rating}</p>
                  <StarRating rating={product.rating} />
                  <p className="text-xs text-text-muted mt-1">{product.reviewCount} reviews</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {ratingDist.map((r) => (
                    <div key={r.stars} className="flex items-center gap-2">
                      <span className="text-xs text-text-muted w-3">{r.stars}</span>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="#F59E0B" aria-hidden="true"><path d="M6 1l1.39 2.82L10.5 4.27l-2.25 2.19.53 3.09L6 8.02 3.22 9.55l.53-3.09L1.5 4.27l3.11-.45L6 1z"/></svg>
                      <progress
                        className="progress-rating flex-1"
                        value={r.pct}
                        max={100}
                        aria-label={`${r.stars} star ratings`}
                      />
                      <span className="text-xs text-text-muted w-8 text-right">{r.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review cards */}
              <div className="space-y-4">
                {displayReviews.length === 0 ? (
                  <p className="text-text-muted text-sm text-center py-8">No reviews yet. Be the first to purchase and review.</p>
                ) : null}
                {displayReviews.map((rev) => (
                  <div key={rev.id} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-bg-elevated border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-display font-bold text-xs text-text-secondary shrink-0">
                          {rev.reviewerInitials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{rev.reviewerName}</p>
                          <p className="text-xs text-text-muted">{rev.reviewerCompany}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <StarRating rating={rev.rating} />
                        <p className="text-xs text-text-muted font-mono mt-0.5">{rev.date}</p>
                      </div>
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed">{rev.text}</p>
                    {rev.verified && (
                      <div className="flex items-center gap-1 mt-2">
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="#00D4FF" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-[10px] text-accent-cyan">Platform verified purchase</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column (sticky) ────────────────────── */}
          <div className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-8 space-y-4">
              <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
                {/* Price */}
                {product.pricingTiers ? (
                  <div>
                    <nav className="flex gap-1 mb-3" aria-label="Pricing plans">
                      {product.pricingTiers.map((tier) => (
                        <AriaNavButton
                          key={tier.id}
                          current={selectedTierId === tier.id}
                          onClick={() => setSelectedTierId(tier.id)}
                          className={cn(
                            'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
                            selectedTierId === tier.id
                              ? 'bg-accent-cyan text-bg-base'
                              : 'border border-[rgba(255,255,255,0.08)] text-text-muted hover:text-text-secondary'
                          )}
                        >
                          {tier.name}
                        </AriaNavButton>
                      ))}
                    </nav>
                    {(() => {
                      const tier = product.pricingTiers!.find((t) => t.id === selectedTierId)!;
                      return (
                        <div>
                          <p className="font-display font-bold text-3xl text-text-primary">
                            ₹{tier.priceINR.toLocaleString('en-IN')}
                            <span className="text-sm font-normal text-text-muted ml-1">/ month</span>
                          </p>
                          <ul className="mt-3 space-y-1.5">
                            {tier.features.map((f, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 8l4 4 8-8"/></svg>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div>
                    <p className="font-display font-bold text-3xl text-text-primary">
                      {formatPrice(product.priceINR, product.pricingModel)}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{getPricingLabel(product.pricingModel)}</p>
                  </div>
                )}

                {/* CTAs */}
                <div className="space-y-2">
                  <Button size="lg" className="w-full" onClick={() => setShowPurchase(true)} data-testid="buy-now-btn">
                    {product.pricingModel === 'subscription' ? 'Subscribe Now' : product.pricingModel === 'freemium' ? 'Get Free' : 'Buy Now'}
                  </Button>
                  {product.hasTryBeforeBuy && (
                    <Button variant="secondary" size="md" className="w-full" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
                      Try Demo First
                    </Button>
                  )}
                </div>

                {/* What you get */}
                {deliverables.length > 0 ? (
                  <div>
                    <p className="text-xs text-text-muted mb-2">What you get:</p>
                    <ul className="space-y-1.5">
                      {deliverables.map((d, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 8l4 4 8-8"/></svg>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Engineer card */}
                <div className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl border border-[rgba(255,255,255,0.06)]">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-sm shrink-0', avatarBgClass(product.engineerName))} aria-hidden="true">
                    {product.engineerInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{product.engineerName}</p>
                    <Link href={`/engineer/${product.engineerId}`} className="text-xs text-accent-cyan hover:underline">
                      View Profile →
                    </Link>
                  </div>
                  <NeuronScoreRing score={product.engineerScore} size={40} strokeWidth={3} animate={false} />
                </div>

                {/* 30-day protection */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.2)] rounded-xl">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="#10B981" aria-hidden="true">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-xs text-accent-green">30-day buyer protection</span>
                </div>

                {/* Wishlist + Share */}
                <div className="flex gap-2">
                  <AriaToggleButton
                    pressed={wishlisted}
                    onClick={() => setWishlisted((w) => !w)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs transition-all',
                      wishlisted
                        ? 'border-[rgba(239,68,68,0.4)] text-accent-red bg-[rgba(239,68,68,0.06)]'
                        : 'border-[rgba(255,255,255,0.08)] text-text-muted hover:text-text-secondary'
                    )}
                    aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M8 14s-6-3.5-6-8a4 4 0 018 0 4 4 0 018 0c0 4.5-6 8-6 8z"/>
                    </svg>
                    {wishlisted ? 'Saved' : 'Wishlist'}
                  </AriaToggleButton>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[rgba(255,255,255,0.08)] text-xs text-text-muted hover:text-text-secondary transition-all">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="13" cy="3" r="1.5"/><circle cx="13" cy="13" r="1.5"/><circle cx="3" cy="8" r="1.5"/>
                      <path d="M4.5 7.5l7-3.5M4.5 8.5l7 3.5"/>
                    </svg>
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase modal */}
      <PurchaseModal
        open={showPurchase}
        onClose={() => setShowPurchase(false)}
        product={product}
        selectedTierId={selectedTierId}
      />
    </div>
  );
}
