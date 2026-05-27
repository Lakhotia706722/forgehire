'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useMyProducts,
  useMarketplaceCatalog,
  useTrendingProducts,
} from '@/lib/api-hooks';
import {
  MarketplaceFilters,
  DEFAULT_MARKET_FILTERS,
  type MarketplaceFilterState,
} from '@/app/(public)/marketplace/_components/marketplace-filters';
import { ProductCard } from '@/app/(public)/marketplace/_components/product-card';
import { ComparisonBar } from '@/app/(public)/marketplace/_components/comparison-bar';
import { CATEGORIES, type ProductCategory } from '@/lib/marketplace-data';

type TabId = 'browse' | 'my-listings';

const STATUS_CONFIG: Record<string, { variant: 'green' | 'amber' | 'gray' | 'red'; label: string }> = {
  published: { variant: 'green', label: 'Published' },
  draft: { variant: 'gray', label: 'Draft' },
  pending_moderation: { variant: 'amber', label: 'Under Review' },
  suspended: { variant: 'red', label: 'Suspended' },
};

export default function EngineerMarketplacePage() {
  const [tab, setTab] = React.useState<TabId>('browse');
  const [activeCategory, setActiveCategory] = React.useState<ProductCategory | 'All'>('All');
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [filters, setFilters] = React.useState<MarketplaceFilterState>(DEFAULT_MARKET_FILTERS);
  const [applied, setApplied] = React.useState<MarketplaceFilterState>(DEFAULT_MARKET_FILTERS);
  const [comparing, setComparing] = React.useState<string[]>([]);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: myProducts, isLoading: myLoading } = useMyProducts();
  const { data: catalog, isLoading: catalogLoading, isError: catalogError, refetch } =
    useMarketplaceCatalog({ limit: 50, query: debouncedSearch || undefined });
  const { data: trending, isLoading: trendingLoading } = useTrendingProducts(6);

  const filtered = React.useMemo(() => {
    const products = catalog ?? [];
    return products.filter((p) => {
      if (activeCategory !== 'All' && p.category !== activeCategory) return false;
      const price = p.priceINR ?? 0;
      if (price < applied.priceRange[0] || price > applied.priceRange[1]) return false;
      if (applied.aiModels.length && p.aiModel && !applied.aiModels.includes(p.aiModel)) {
        return false;
      }
      if (applied.minRating > 0 && (p.rating ?? 0) < applied.minRating) return false;
      if (applied.minNeuronScore > 0 && (p.engineerScore ?? 0) < applied.minNeuronScore) {
        return false;
      }
      if (applied.tryBeforeBuy && !p.hasTryBeforeBuy) return false;
      if (applied.pricingModels.length && !applied.pricingModels.includes(p.pricingModel)) {
        return false;
      }
      return true;
    });
  }, [catalog, activeCategory, applied]);

  const products = catalog ?? [];
  const totalRevenue = (myProducts ?? []).reduce((s, p) => s + p.revenue, 0);
  const totalSales = (myProducts ?? []).reduce((s, p) => s + p.purchaseCount, 0);
  const selectedProducts = products.filter((p) => comparing.includes(p.id));

  function toggleCompare(id: string) {
    setComparing((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev,
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">
              Marketplace
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Browse AI products, manage your listings, and grow your seller revenue
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/engineer/marketplace/purchases">
              <Button variant="secondary" size="md">
                My Purchases
              </Button>
            </Link>
            <Link href="/engineer/marketplace/list">
              <Button size="md">+ List Product</Button>
            </Link>
          </div>
        </div>

        {/* Seller stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {myLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : (
            [
              { label: 'My Products', value: String((myProducts ?? []).length), color: '#00D4FF' },
              { label: 'Published', value: String((myProducts ?? []).filter((p) => p.status === 'published').length), valueClass: 'stat-value-green' },
              { label: 'Total Sales', value: String(totalSales), valueClass: 'stat-value-amber' },
              { label: 'Revenue', value: totalRevenue > 0 ? `₹${totalRevenue.toLocaleString('en-IN')}` : '₹0', valueClass: 'stat-value-violet' },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center"
              >
                <p className={cn('font-mono font-bold text-xl', s.valueClass)}>
                  {s.value}
                </p>
                <p className="text-xs text-text-muted mt-1">{s.label}</p>
              </div>
            ))
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[rgba(255,255,255,0.06)]">
          {(
            [
              { id: 'browse' as const, label: 'Browse Products' },
              { id: 'my-listings' as const, label: 'My Listings' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t.id
                  ? 'border-accent-cyan text-accent-cyan'
                  : 'border-transparent text-text-muted hover:text-text-secondary',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'browse' && (
          <>
            {/* Search */}
            <div className="relative max-w-xl">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <circle cx="6.5" cy="6.5" r="4.5" />
                <path d="M10.5 10.5l3 3" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl pl-11 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
                aria-label="Search marketplace"
              />
            </div>

            {/* Trending */}
            {(trendingLoading || (trending && trending.length > 0)) && (
              <section>
                <h2 className="font-display font-semibold text-text-primary text-lg mb-4">
                  Trending now
                </h2>
                {trendingLoading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-64 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {trending!.map((p) => (
                      <ProductCard
                        key={`trending-${p.id}`}
                        product={p}
                        onCompareToggle={toggleCompare}
                        isComparing={comparing.includes(p.id)}
                        compareDisabled={comparing.length >= 4 && !comparing.includes(p.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory('All')}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border transition-all',
                  activeCategory === 'All'
                    ? 'bg-accent-cyan text-bg-base border-accent-cyan'
                    : 'border-[rgba(255,255,255,0.1)] text-text-muted',
                )}
              >
                All ({products.length})
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border transition-all',
                    activeCategory === cat.id
                      ? 'bg-accent-cyan text-bg-base border-accent-cyan'
                      : 'border-[rgba(255,255,255,0.1)] text-text-muted',
                  )}
                >
                  {cat.icon} {cat.id}
                </button>
              ))}
            </div>

            <div className="flex gap-8">
              <div className="hidden md:block w-64 shrink-0">
                <div className="sticky top-24">
                  <MarketplaceFilters
                    filters={filters}
                    onChange={setFilters}
                    onApply={() => setApplied(filters)}
                    onReset={() => {
                      setFilters(DEFAULT_MARKET_FILTERS);
                      setApplied(DEFAULT_MARKET_FILTERS);
                    }}
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-secondary mb-4">
                  {catalogLoading ? 'Loading...' : `${filtered.length} products`}
                </p>

                {catalogError ? (
                  <div className="text-center py-16">
                    <p className="text-text-muted text-sm mb-3">Could not load products.</p>
                    <Button size="sm" onClick={() => refetch()}>
                      Retry
                    </Button>
                  </div>
                ) : catalogLoading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-64 rounded-xl" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-text-muted text-sm">No products match your filters.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFilters(DEFAULT_MARKET_FILTERS);
                        setApplied(DEFAULT_MARKET_FILTERS);
                        setSearch('');
                      }}
                      className="mt-3 text-sm text-accent-cyan hover:underline"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        onCompareToggle={toggleCompare}
                        isComparing={comparing.includes(p.id)}
                        compareDisabled={comparing.length >= 4 && !comparing.includes(p.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <ComparisonBar
              selected={selectedProducts}
              onRemove={(id) => setComparing((prev) => prev.filter((x) => x !== id))}
              onClear={() => setComparing([])}
            />
            {comparing.length >= 2 && <div className="h-20" aria-hidden="true" />}
          </>
        )}

        {tab === 'my-listings' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">Products you&apos;ve listed for sale</p>
              <Link href="/engineer/marketplace/my-products">
                <Button variant="ghost" size="sm">
                  View all →
                </Button>
              </Link>
            </div>

            {myLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : !myProducts || myProducts.length === 0 ? (
              <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-12 text-center">
                <p className="text-text-muted text-sm mb-3">You haven&apos;t listed any products yet.</p>
                <Link href="/engineer/marketplace/list">
                  <Button size="md">Create your first product</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myProducts.map((product) => {
                  const statusConfig = STATUS_CONFIG[product.status] ?? STATUS_CONFIG.draft;
                  return (
                    <div
                      key={product.id}
                      className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-display font-semibold text-text-primary">
                            {product.name}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5 capitalize">
                            {product.category.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-6 text-xs text-text-muted mb-4">
                        <span>
                          Price:{' '}
                          <span className="text-text-secondary font-mono">
                            ₹{product.priceINR.toLocaleString('en-IN')}
                          </span>
                        </span>
                        <span>
                          Sales:{' '}
                          <span className="text-text-secondary font-mono">
                            {product.purchaseCount}
                          </span>
                        </span>
                        <span>
                          Revenue:{' '}
                          <span className="text-accent-green font-mono">
                            ₹{product.revenue.toLocaleString('en-IN')}
                          </span>
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/engineer/marketplace/${product.id}/analytics`}>
                          <Button variant="secondary" size="sm">
                            Analytics
                          </Button>
                        </Link>
                        <Link href={`/engineer/marketplace/${product.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        {product.status === 'published' && (
                          <Link href={`/marketplace/${product.slug}`}>
                            <Button variant="ghost" size="sm">
                              View public →
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
