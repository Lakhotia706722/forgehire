'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyProducts } from '@/lib/api-hooks';

const STATUS_CONFIG: Record<string, { variant: 'green' | 'amber' | 'gray' | 'red'; label: string }> = {
  published:          { variant: 'green', label: 'Published' },
  draft:              { variant: 'gray',  label: 'Draft' },
  pending_moderation: { variant: 'amber', label: 'Under Review' },
  suspended:          { variant: 'red',   label: 'Suspended' },
};

export default function MyProductsPage() {
  const { data: products, isLoading } = useMyProducts();

  const totalRevenue = (products ?? []).reduce((s, p) => s + p.revenue, 0);
  const totalSales = (products ?? []).reduce((s, p) => s + p.purchaseCount, 0);

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">My Products</h1>
            <p className="text-text-secondary text-sm mt-1">Manage your marketplace listings</p>
          </div>
          <Link href="/engineer/marketplace/list">
            <Button size="md">+ New Product</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : (
            [
              { label: 'Total Products', value: (products ?? []).length, color: '#00D4FF' },
              { label: 'Total Sales',    value: totalSales,              color: '#F59E0B' },
              { label: 'Total Revenue',  value: `₹${(totalRevenue / 1000).toFixed(0)}K`, color: '#10B981' },
            ].map((s) => (
              <div key={s.label} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
                <p className="font-mono font-bold text-2xl" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-text-muted mt-1">{s.label}</p>
              </div>
            ))
          )}
        </div>

        {/* Products list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton rounded className="h-5 w-20" />
                </div>
                <Skeleton className="h-3 w-64" />
              </div>
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-12 text-center">
            <p className="text-text-muted text-sm">No products yet</p>
            <Link href="/engineer/marketplace/list" className="mt-3 inline-block text-xs text-accent-cyan hover:underline">
              Create your first product →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => {
              const statusConfig = STATUS_CONFIG[product.status] ?? STATUS_CONFIG.draft;
              return (
                <div key={product.id} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(255,255,255,0.1)] transition-all">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-display font-semibold text-text-primary">{product.name}</p>
                    </div>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-6 text-xs text-text-muted mb-4">
                    <span>Price: <span className="text-text-secondary font-mono">₹{product.priceINR.toLocaleString('en-IN')}</span></span>
                    <span>Sales: <span className="text-text-secondary font-mono">{product.purchaseCount}</span></span>
                    <span>Revenue: <span className="text-accent-green font-mono">₹{product.revenue.toLocaleString('en-IN')}</span></span>
                    {product.rating && (
                      <span>Rating: <span className="text-accent-amber font-mono">★ {product.rating} ({product.reviewCount})</span></span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/engineer/marketplace/${product.id}/analytics`}>
                      <Button variant="secondary" size="sm">Analytics</Button>
                    </Link>
                    <Link href={`/engineer/marketplace/${product.id}/edit`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                    <Link href={`/marketplace/${product.slug}`}>
                      <Button variant="ghost" size="sm">View →</Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
