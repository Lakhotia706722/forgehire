'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyPurchases } from '@/lib/api-hooks';

export default function MyPurchasesPage() {
  const { data: purchases, isLoading } = useMyPurchases();

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">My Purchases</h1>
          <p className="text-text-secondary text-sm mt-1">Products you&apos;ve bought from the marketplace</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : !purchases || purchases.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted text-sm">No purchases yet.</p>
            <Link href="/marketplace" className="mt-3 inline-block text-xs text-accent-cyan hover:underline">
              Browse marketplace →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-display font-semibold text-text-primary">{purchase.productName}</p>
                    <p className="text-xs text-text-muted mt-0.5">by {purchase.engineerName}</p>
                  </div>
                  <Badge variant="green">Active</Badge>
                </div>
                <div className="flex flex-wrap gap-6 text-xs text-text-muted mb-4">
                  <span>Paid: <span className="text-text-secondary font-mono">₹{purchase.priceINR.toLocaleString('en-IN')}</span></span>
                  <span>License: <span className="text-text-secondary font-mono">{purchase.licenseKey}</span></span>
                  <span>Purchased: <span className="text-text-secondary">{new Date(purchase.purchasedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
                </div>
                <Link href={`/marketplace/${purchase.productSlug}`}>
                  <button className="text-xs text-accent-cyan hover:underline">View Product →</button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
