'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Review } from '@/lib/mock-data';

type SortOrder = 'recent' | 'highest' | 'lowest';

interface TabReviewsProps {
  reviews: Review[];
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width={size}
          height={size}
          viewBox="0 0 12 12"
          fill={s <= rating ? '#F59E0B' : 'rgba(255,255,255,0.1)'}
          aria-hidden="true"
        >
          <path d="M6 1l1.39 2.82L10.5 4.27l-2.25 2.19.53 3.09L6 8.02 3.22 9.55l.53-3.09L1.5 4.27l3.11-.45L6 1z"/>
        </svg>
      ))}
    </div>
  );
}

export function TabReviews({ reviews }: TabReviewsProps) {
  const [sort, setSort] = React.useState<SortOrder>('recent');

  const sorted = [...reviews].sort((a, b) => {
    if (sort === 'highest') return b.rating - a.rating;
    if (sort === 'lowest')  return a.rating - b.rating;
    return 0; // recent — keep original order
  });

  return (
    <div>
      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-6" role="group" aria-label="Sort reviews">
        <span className="text-xs text-text-muted">Sort:</span>
        {(['recent', 'highest', 'lowest'] as SortOrder[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-lg border transition-all duration-150',
              sort === s
                ? 'border-[rgba(0,212,255,0.4)] bg-[rgba(0,212,255,0.08)] text-accent-cyan'
                : 'border-[rgba(255,255,255,0.08)] text-text-muted hover:text-text-secondary'
            )}
            aria-pressed={sort === s}
          >
            {s === 'recent' ? 'Most Recent' : s === 'highest' ? 'Highest Rated' : 'Lowest Rated'}
          </button>
        ))}
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {sorted.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ review: r }: { review: Review }) {
  return (
    <article className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-bg-elevated border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-display font-bold text-xs text-text-secondary">
            {r.reviewerInitials}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{r.reviewerName}</p>
            <p className="text-xs text-text-muted">{r.reviewerCompany}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <StarRating rating={r.rating} />
          <p className="text-xs text-text-muted mt-1 font-mono">{r.date}</p>
        </div>
      </div>

      {/* Review text */}
      <p className="text-text-secondary text-sm leading-relaxed mb-3">{r.text}</p>

      {/* Project ref + verified */}
      <div className="flex items-center gap-3">
        <span className="text-xs px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-text-muted font-mono">
          {r.projectRef}
        </span>
        {r.verified && (
          <span className="flex items-center gap-1 text-xs text-accent-cyan">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            Platform verified
          </span>
        )}
      </div>

      {/* Engineer response */}
      {r.engineerResponse && (
        <div className="mt-4 ml-4 pl-4 border-l-2 border-[rgba(0,212,255,0.2)]">
          <p className="text-xs text-text-muted mb-1 font-medium">Engineer&apos;s response</p>
          <p className="text-sm text-text-secondary leading-relaxed">{r.engineerResponse}</p>
        </div>
      )}
    </article>
  );
}
