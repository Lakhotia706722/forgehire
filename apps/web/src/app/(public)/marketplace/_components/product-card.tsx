'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { formatPrice, type ProductListing } from '@/lib/marketplace-data';

interface ProductCardProps {
  product: ProductListing;
  onCompareToggle?: (id: string) => void;
  isComparing?: boolean;
  compareDisabled?: boolean;
  recommendedReason?: string;
  'data-testid'?: string;
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} width="11" height="11" viewBox="0 0 12 12"
            fill={s <= Math.floor(rating) ? '#F59E0B' : s - 0.5 <= rating ? '#F59E0B' : 'rgba(255,255,255,0.1)'}
            aria-hidden="true">
            <path d="M6 1l1.39 2.82L10.5 4.27l-2.25 2.19.53 3.09L6 8.02 3.22 9.55l.53-3.09L1.5 4.27l3.11-.45L6 1z"/>
          </svg>
        ))}
      </div>
      <span className="text-xs font-mono text-text-muted">{rating} ({count})</span>
    </div>
  );
}

export function ProductCard({
  product: p,
  onCompareToggle,
  isComparing = false,
  compareDisabled = false,
  recommendedReason,
  'data-testid': testId,
}: ProductCardProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <article
      className={cn(
        'group relative bg-bg-surface rounded-xl border border-[rgba(255,255,255,0.06)]',
        'transition-all duration-200 overflow-hidden',
        'hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
        'hover:border-[rgba(0,212,255,0.2)]',
        isComparing && 'ring-2 ring-accent-cyan ring-offset-2 ring-offset-bg-base'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={testId ?? `product-card-${p.id}`}
    >
      {/* Thumbnail */}
      <div className={`relative h-40 bg-gradient-to-br ${p.thumbnailGradient} overflow-hidden`}>
        <div className="absolute inset-0 geo-pattern opacity-30" aria-hidden="true" />

        {/* Try before buy badge */}
        {p.hasTryBeforeBuy && (
          <div className="absolute top-2 left-2 z-10">
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[rgba(0,212,255,0.15)] text-accent-cyan border border-[rgba(0,212,255,0.3)]">
              Try free
            </span>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="gray" className="text-[10px] bg-bg-elevated/80 backdrop-blur-sm">{p.category}</Badge>
        </div>

        {/* Compare checkbox */}
        {onCompareToggle && (
          <div className="absolute bottom-2 left-2 z-10">
            <label className="flex items-center gap-1.5 cursor-pointer" onClick={(e) => e.stopPropagation()}>
              <div
                className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                  isComparing
                    ? 'bg-accent-cyan border-accent-cyan'
                    : 'border-white/40 bg-bg-elevated/80 hover:border-accent-cyan',
                  compareDisabled && !isComparing && 'opacity-40 cursor-not-allowed'
                )}
                onClick={() => !compareDisabled && onCompareToggle(p.id)}
                role="checkbox"
                aria-checked={isComparing}
                aria-label={`Compare ${p.name}`}
                aria-disabled={compareDisabled && !isComparing}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && !compareDisabled && onCompareToggle(p.id)}
                data-testid={`compare-checkbox-${p.id}`}
              >
                {isComparing && (
                  <svg width="8" height="6" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#080B14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-[10px] text-white/70 font-mono">Compare</span>
            </label>
          </div>
        )}

        {/* Recommended reason tooltip */}
        {recommendedReason && (
          <div className="absolute bottom-2 right-2 z-10 group/tip">
            <div className="w-5 h-5 rounded-full bg-accent-violet/80 flex items-center justify-center cursor-help">
              <span className="text-[10px] text-white font-bold">?</span>
            </div>
            <div className="absolute bottom-full right-0 mb-1 w-48 bg-bg-elevated border border-[rgba(123,94,167,0.3)] rounded-lg p-2 text-[10px] text-text-secondary hidden group-hover/tip:block z-20 shadow-xl">
              {recommendedReason}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name + tagline */}
        <Link href={`/marketplace/${p.id}`}>
          <h3 className="font-semibold text-text-primary text-[15px] mb-0.5 group-hover:text-accent-cyan transition-colors line-clamp-1">
            {p.name}
          </h3>
        </Link>
        <p className="text-text-muted text-xs mb-3 line-clamp-1">{p.tagline}</p>

        {/* Engineer row */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-[8px] shrink-0"
            style={{ background: p.engineerColor }}
            aria-hidden="true"
          >
            {p.engineerInitials}
          </div>
          <span className="text-xs text-text-muted truncate">{p.engineerName}</span>
          <NeuronScoreRing score={p.engineerScore} size={24} strokeWidth={2} animate={false} />
        </div>

        {/* Rating */}
        <div className="mb-3">
          <StarRating rating={p.rating} count={p.reviewCount} />
        </div>

        {/* Price */}
        <div className="mb-4">
          <span className="text-lg font-semibold text-text-primary font-mono">
            {formatPrice(p.priceINR, p.pricingModel)}
          </span>
          {p.pricingModel !== 'freemium' && (
            <span className="text-xs text-text-muted ml-1">
              {p.pricingModel === 'one_time' ? 'one-time' : p.pricingModel === 'subscription' ? '/ month' : '/ call'}
            </span>
          )}
        </div>

        {/* CTA buttons — always visible on mobile, appear on hover desktop */}
        <div className={cn(
          'grid grid-cols-2 gap-2 transition-all duration-200',
          'md:opacity-0 md:translate-y-1 group-hover:md:opacity-100 group-hover:md:translate-y-0'
        )}>
          {p.hasTryBeforeBuy && (
            <Link href={`/marketplace/${p.id}#demo`} className="block">
              <Button variant="secondary" size="sm" className="w-full text-xs h-8">
                Try Demo
              </Button>
            </Link>
          )}
          <Link
            href={`/marketplace/${p.id}`}
            className={cn('block', !p.hasTryBeforeBuy && 'col-span-2')}
          >
            <Button size="sm" className="w-full text-xs h-8">
              {p.pricingModel === 'freemium' ? 'Get Free' : 'Buy Now'}
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
