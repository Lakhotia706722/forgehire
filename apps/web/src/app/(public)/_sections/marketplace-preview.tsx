'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedProducts, type FeaturedProduct } from '@/lib/api-hooks';

const CATEGORY_LABELS: Record<string, string> = {
  ai_agents: 'AI Agents',
  fine_tuned_models: 'Fine-tuned Models',
  saas_tools: 'SaaS Tools',
  automation_workflows: 'Automation',
  datasets_prompts: 'Datasets',
  apis_microservices: 'APIs',
};

const GRADIENTS = [
  'from-[rgba(0,212,255,0.15)] to-[rgba(123,94,167,0.1)]',
  'from-[rgba(123,94,167,0.15)] to-[rgba(245,158,11,0.08)]',
  'from-[rgba(16,185,129,0.1)] to-[rgba(0,212,255,0.08)]',
];

function StarRating({ rating }: { rating: number }) {
  const safeRating = Number.isFinite(rating) ? rating : 0;
  return (
    <div className="flex items-center gap-1" aria-label={`Rating: ${safeRating} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill={s <= Math.floor(safeRating) ? '#F59E0B' : 'rgba(255,255,255,0.1)'}
          aria-hidden="true"
        >
          <path d="M6 1l1.39 2.82L10.5 4.27l-2.25 2.19.53 3.09L6 8.02 3.22 9.55l.53-3.09L1.5 4.27l3.11-.45L6 1z"/>
        </svg>
      ))}
      <span className="text-xs font-mono text-text-muted ml-1">{safeRating.toFixed(1)}</span>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function EmptyProductCard() {
  return (
    <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden flex flex-col items-center justify-center h-[280px]">
      <p className="text-text-muted text-sm">No products yet</p>
      <p className="text-text-muted text-xs mt-1">Be the first to publish</p>
    </div>
  );
}

function formatPrice(product: FeaturedProduct): string {
  const price = `₹${Number(product.priceINR ?? 0).toLocaleString('en-IN')}`;
  if (product.pricingModel === 'subscription') return `${price}/mo`;
  if (product.pricingModel === 'per_call') return `${price}/call`;
  return price;
}

export function MarketplacePreviewSection() {
  const { data: products, isLoading, error } = useFeaturedProducts();

  return (
    <section className="py-24 px-6" aria-labelledby="marketplace-heading">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-mono text-accent-amber uppercase tracking-widest">
              AI Marketplace
            </span>
            <h2 id="marketplace-heading" className="font-display text-3xl font-bold text-text-primary mt-1">
              Buy &amp; Sell AI Products
            </h2>
          </div>
          <Link href="/marketplace" className="text-sm text-accent-cyan hover:underline hidden sm:block">
            Browse marketplace →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} />)
          ) : error || !products || products.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => <EmptyProductCard key={i} />)
          ) : (
            products.map((p, i) => <ProductCard key={p.id} product={p} gradientIndex={i} />)
          )}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product: p, gradientIndex }: { product: FeaturedProduct; gradientIndex: number }) {
  const gradient = GRADIENTS[gradientIndex % GRADIENTS.length];
  const categoryLabel = CATEGORY_LABELS[p.category] || p.category || 'Product';
  const rating = Number(p.rating ?? 0);
  const reviewCount = Number(p.reviewCount ?? 0);

  return (
    <article className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden hover:border-[rgba(0,212,255,0.2)] hover:-translate-y-1 transition-all duration-300 group">
      {/* Thumbnail */}
      <div
        className={`h-36 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}
        aria-hidden="true"
      >
        <div className="absolute inset-0 geo-pattern opacity-30" />
        {p.thumbnailUrl && !p.thumbnailUrl.includes('placeholder') ? (
          <Image
            src={p.thumbnailUrl}
            alt={p.name}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="relative z-10 w-12 h-12 rounded-xl bg-bg-elevated border border-[rgba(255,255,255,0.1)] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant="amber" className="text-[10px]">{categoryLabel}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display font-semibold text-text-primary text-sm mb-1 group-hover:text-accent-cyan transition-colors line-clamp-1">
          {p.name}
        </h3>
        <p className="text-text-muted text-xs mb-3 leading-relaxed line-clamp-2">{p.tagline}</p>

        <div className="flex items-center justify-between mb-4">
          <StarRating rating={rating} />
          <span className="text-xs text-text-muted font-mono">{reviewCount} reviews</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono font-semibold text-accent-cyan">{formatPrice(p)}</span>
          <Link
            href={`/marketplace/${p.slug}`}
            className="text-xs px-3 py-1.5 rounded-lg border border-[rgba(0,212,255,0.3)] text-accent-cyan hover:bg-[rgba(0,212,255,0.05)] transition-colors"
          >
            View →
          </Link>
        </div>
      </div>
    </article>
  );
}
