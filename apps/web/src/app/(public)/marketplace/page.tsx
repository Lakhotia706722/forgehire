'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { MarketplaceFilters, DEFAULT_MARKET_FILTERS, type MarketplaceFilterState } from './_components/marketplace-filters';
import { ProductCard } from './_components/product-card';
import { ComparisonBar } from './_components/comparison-bar';
import { CATEGORIES, type ProductCategory, type ProductListing } from '@/lib/marketplace-data';
import { useQuery } from '@tanstack/react-query';
import { apiFetchList } from '@/lib/api-fetch';
import { mapApiProductToListing } from '@/lib/map-api-product';
import { AriaNavButton } from '@/components/ui/aria-tab-button';

type SortOption = 'trending' | 'newest' | 'highest_rated' | 'most_purchased';
const CATEGORY_TO_API: Record<ProductCategory, string> = {
  'AI Agents': 'ai_agents',
  'Fine-Tuned Models': 'fine_tuned_models',
  'SaaS Tools': 'saas_tools',
  Automation: 'automation_workflows',
  'Datasets & Prompts': 'datasets_prompts',
  APIs: 'apis_microservices',
};

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = React.useState<ProductCategory | 'All'>('All');
  const [filters, setFilters] = React.useState<MarketplaceFilterState>(DEFAULT_MARKET_FILTERS);
  const [applied, setApplied] = React.useState<MarketplaceFilterState>(DEFAULT_MARKET_FILTERS);
  const [search, setSearch] = React.useState('');
  const [comparing, setComparing] = React.useState<string[]>([]);
  const [sortBy, setSortBy] = React.useState<SortOption>('trending');

  const { data: productsData, isLoading: loading, isError, refetch } = useQuery({
    queryKey: ['products', 'marketplace', applied, activeCategory, search, sortBy],
    queryFn: async () => {
      const sortMap: Record<SortOption, { sortBy: string; sortOrder: string }> = {
        trending: { sortBy: 'viewCount', sortOrder: 'desc' },
        newest: { sortBy: 'publishedAt', sortOrder: 'desc' },
        highest_rated: { sortBy: 'rating', sortOrder: 'desc' },
        most_purchased: { sortBy: 'purchaseCount', sortOrder: 'desc' },
      };
      const params = new URLSearchParams({
        status: 'published',
        limit: '50',
        minPrice: String(applied.priceRange[0]),
        maxPrice: String(applied.priceRange[1]),
        minRating: String(applied.minRating),
        hasDemo: String(applied.tryBeforeBuy),
        query: search,
        ...sortMap[sortBy],
      });
      if (activeCategory !== 'All') {
        params.set('category', CATEGORY_TO_API[activeCategory]);
      }
      if (applied.aiModels.length > 0) params.set('aiModel', applied.aiModels[0]);
      if (applied.pricingModels.length > 0) params.set('pricingModel', applied.pricingModels[0]);
      const items = await apiFetchList<Record<string, unknown>>(
        `/api/products?${params.toString()}`,
      );
      return items.map((item, i) => mapApiProductToListing(item, i));
    },
    staleTime: 60_000,
  });

  const products = React.useMemo(
    () => productsData ?? [],
    [productsData],
  );

  // Client-side refinement for multi-select filters.
  const filtered = React.useMemo(() => {
    return products.filter((p) => {
      if (activeCategory !== 'All' && p.category !== activeCategory) return false;
      if (
        search &&
        !(p.name ?? '').toLowerCase().includes(search.toLowerCase()) &&
        !(p.tagline ?? '').toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
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
      if (applied.pricingModels.length && !applied.pricingModels.includes(p.pricingModel)) return false;
      return true;
    });
  }, [products, activeCategory, search, applied]);

  const selectedProducts = products.filter((p) => comparing.includes(p.id));

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
      <div className="relative marketplace-hero-banner bg-bg-surface border-b border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute w-96 h-96 rounded-full animate-blob-1 marketplace-hero-blob-1" />
          <div className="absolute w-80 h-80 rounded-full animate-blob-2 marketplace-hero-blob-2" />
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
          <nav className="flex gap-0 overflow-x-auto scrollbar-none" aria-label="Product categories">
            {[{ id: 'All' as const, icon: '🌐', count: products.length }, ...CATEGORIES].map((cat) => (
              <AriaNavButton
                key={cat.id}
                current={activeCategory === cat.id}
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
              </AriaNavButton>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
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
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-bg-elevated border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none"
                aria-label="Sort products"
              >
                <option value="trending">Trending</option>
                <option value="newest">Newest</option>
                <option value="highest_rated">Highest rated</option>
                <option value="most_purchased">Most purchased</option>
              </select>
            </div>

            {isError ? (
              <div className="text-center py-20">
                <p className="text-red-400 text-sm">Could not load marketplace products.</p>
                <button onClick={() => refetch()} className="mt-3 text-sm text-accent-cyan hover:underline">
                  Retry
                </button>
              </div>
            ) : loading ? (
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
