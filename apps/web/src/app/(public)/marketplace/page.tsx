'use client';

import * as React from 'react';
import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { MarketplaceFilters, DEFAULT_MARKET_FILTERS, type MarketplaceFilterState } from './_components/marketplace-filters';
import { ProductCard } from './_components/product-card';
import { ComparisonBar } from './_components/comparison-bar';
import { allProducts, CATEGORIES, type ProductCategory, type ProductListing } from '@/lib/marketplace-data';
import { useQuery } from '@tanstack/react-query';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

const RECOMMENDED_REASONS: Record<string, string> = {
  'prod-1': 'Matches your tech stack (LangChain, FastAPI)',
  'prod-2': 'Popular with companies in your industry',
  'prod-6': 'Highly rated by fintech companies like yours',
};

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = React.useState<ProductCategory | 'All'>('All');
  const [filters, setFilters] = React.useState<MarketplaceFilterState>(DEFAULT_MARKET_FILTERS);
  const [applied, setApplied] = React.useState<MarketplaceFilterState>(DEFAULT_MARKET_FILTERS);
  const [search, setSearch] = React.useState('');
  const [comparing, setComparing] = React.useState<string[]>([]);

  const { data: productsData, isLoading: loading } = useQuery({
    queryKey: ['products', 'marketplace', applied, activeCategory, search],
    queryFn: () => apiFetch<{ products: ProductListing[] }>(`/api/products?status=published&limit=50`),
    staleTime: 60_000,
  });

  const allProducts: ProductListing[] = productsData?.products ?? allProducts;

  // Filter products
  const filtered = React.useMemo(() => {
    return allProducts.filter((p) => {
      if (activeCategory !== 'All' && p.category !== activeCategory) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
          !p.tagline.toLowerCase().includes(search.toLowerCase())) return false;
      if (p.priceINR < applied.priceRange[0] || p.priceINR > applied.priceRange[1]) return false;
      if (applied.aiModels.length && !applied.aiModels.includes(p.aiModel)) return false;
      if (applied.minRating > 0 && p.rating < applied.minRating) return false;
      if (applied.minNeuronScore > 0 && p.engineerScore < applied.minNeuronScore) return false;
      if (applied.tryBeforeBuy && !p.hasTryBeforeBuy) return false;
      if (applied.pricingModels.length && !applied.pricingModels.includes(p.pricingModel)) return false;
      return true;
    });
  }, [allProducts, activeCategory, search, applied]);

  const selectedProducts = allProducts.filter((p) => comparing.includes(p.id));

  function toggleCompare(id: string) {
    setComparing((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 4 ? [...prev, id] : prev
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero banner */}
      <div className="relative bg-bg-surface border-b border-[rgba(255,255,255,0.06)] overflow-hidden" style={{ height: 280 }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute w-96 h-96 rounded-full animate-blob-1" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)', top: '-20%', left: '10%' }} />
          <div className="absolute w-80 h-80 rounded-full animate-blob-2" style={{ background: 'radial-gradient(circle, rgba(123,94,167,0.1) 0%, transparent 70%)', top: '10%', right: '15%' }} />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-3">
            AI-Built Tools, Ready to Deploy
          </h1>
          <p className="text-text-secondary text-sm mb-6 max-w-lg">
            Discover production-ready AI products built by verified engineers. Try before you buy.
          </p>
          {/* Search */}
          <div className="relative w-full max-w-lg">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/>
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search AI tools, models, APIs..."
              className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.1)] rounded-xl pl-11 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.4)] transition-all shadow-lg"
              aria-label="Search marketplace"
            />
          </div>
          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {CATEGORIES.slice(0, 6).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border transition-all duration-150',
                  activeCategory === cat.id
                    ? 'bg-accent-cyan text-bg-base border-accent-cyan font-semibold'
                    : 'border-[rgba(255,255,255,0.1)] text-text-muted hover:border-[rgba(255,255,255,0.2)] hover:text-text-secondary'
                )}
              >
                {cat.icon} {cat.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category nav (sticky) */}
      <div className="sticky top-16 z-30 bg-bg-base/90 backdrop-blur-sm border-b border-[rgba(255,255,255,0.06)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-0 overflow-x-auto scrollbar-none" role="tablist" aria-label="Product categories">
            {[{ id: 'All' as const, icon: '🌐', count: allProducts.length }, ...CATEGORIES].map((cat) => (
              <button
                key={cat.id}
                role="tab"
                aria-selected={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id as ProductCategory | 'All')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors relative',
                  activeCategory === cat.id
                    ? 'text-text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                {'icon' in cat && <span aria-hidden="true">{cat.icon}</span>}
                {cat.id}
                <span className={cn(
                  'text-[10px] font-mono px-1.5 py-0.5 rounded-full',
                  activeCategory === cat.id
                    ? 'bg-[rgba(0,212,255,0.15)] text-accent-cyan'
                    : 'bg-[rgba(255,255,255,0.05)] text-text-muted'
                )}>
                  {cat.count}
                </span>
                {activeCategory === cat.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan rounded-full" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* AI Recommendations (company users) */}
        <div className="mb-8 bg-[rgba(123,94,167,0.06)] border border-[rgba(123,94,167,0.2)] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="#7B5EA7" aria-hidden="true">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
            </svg>
            <span className="text-sm font-medium text-accent-violet">Recommended for Sarvam AI</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {allProducts.filter((p) => RECOMMENDED_REASONS[p.id]).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onCompareToggle={toggleCompare}
                isComparing={comparing.includes(p.id)}
                compareDisabled={comparing.length >= 4 && !comparing.includes(p.id)}
                recommendedReason={RECOMMENDED_REASONS[p.id]}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters sidebar */}
          <div className="hidden md:block w-64 shrink-0">
            <div className="sticky top-32">
              <MarketplaceFilters
                filters={filters}
                onChange={setFilters}
                onApply={() => setApplied(filters)}
                onReset={() => { setFilters(DEFAULT_MARKET_FILTERS); setApplied(DEFAULT_MARKET_FILTERS); }}
              />
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-text-secondary">
                {loading ? '...' : `${filtered.length} products`}
              </p>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
                    <Skeleton className="h-40 rounded-none" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-text-muted text-sm">No products match your filters.</p>
                <button onClick={() => { setFilters(DEFAULT_MARKET_FILTERS); setApplied(DEFAULT_MARKET_FILTERS); setSearch(''); }} className="mt-3 text-sm text-accent-cyan hover:underline">
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" role="list" aria-label="Marketplace products">
                {filtered.map((p) => (
                  <div key={p.id} role="listitem">
                    <ProductCard
                      product={p}
                      onCompareToggle={toggleCompare}
                      isComparing={comparing.includes(p.id)}
                      compareDisabled={comparing.length >= 4 && !comparing.includes(p.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison bar */}
      <ComparisonBar
        selected={selectedProducts}
        onRemove={(id) => setComparing((prev) => prev.filter((x) => x !== id))}
        onClear={() => setComparing([])}
      />

      {/* Bottom padding for comparison bar */}
      {comparing.length >= 2 && <div className="h-20" aria-hidden="true" />}
    </div>
  );
}
