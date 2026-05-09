import { Badge } from '@/components/ui/badge';
import type { MarketplaceProduct } from '@/lib/mock-data';

interface TabMarketplaceProps {
  products: MarketplaceProduct[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="11" height="11" viewBox="0 0 12 12" fill={s <= Math.floor(rating) ? '#F59E0B' : 'rgba(255,255,255,0.1)'} aria-hidden="true">
          <path d="M6 1l1.39 2.82L10.5 4.27l-2.25 2.19.53 3.09L6 8.02 3.22 9.55l.53-3.09L1.5 4.27l3.11-.45L6 1z"/>
        </svg>
      ))}
      <span className="text-xs font-mono text-text-muted ml-1">{rating}</span>
    </div>
  );
}

export function TabMarketplace({ products }: TabMarketplaceProps) {
  if (!products.length) {
    return (
      <div className="text-center py-16 text-text-muted">
        <p className="text-sm">No marketplace products yet.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((p) => (
        <article
          key={p.id}
          className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden hover:border-[rgba(0,212,255,0.2)] hover:-translate-y-0.5 transition-all duration-300 group"
        >
          {/* Thumbnail */}
          <div className={`h-32 bg-gradient-to-br ${p.gradient} relative overflow-hidden`} aria-hidden="true">
            <div className="absolute inset-0 geo-pattern opacity-30" />
            <div className="absolute top-3 left-3">
              <Badge variant="amber" className="text-[10px]">{p.category}</Badge>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-display font-semibold text-text-primary text-sm mb-2 group-hover:text-accent-cyan transition-colors">
              {p.title}
            </h3>
            <div className="flex items-center justify-between">
              <StarRating rating={p.rating} />
              <span className="font-mono font-semibold text-accent-cyan text-sm">{p.price}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
