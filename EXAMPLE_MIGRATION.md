# Example: Migrating Featured Engineers Section from Mock to Real Data

## BEFORE (Mock Data)

```typescript
// apps/web/src/app/(public)/_sections/featured-engineers.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';

const ENGINEERS = [
  {
    id: 'arjun-sharma',
    name: 'Arjun Sharma',
    headline: 'LLM Engineer · RAG Systems · Agentic AI',
    score: 920,
    skills: ['LangChain', 'PyTorch', 'FastAPI'],
    rate: '₹4,500/hr',
    available: true,
  },
  // ... more mock data
];

export function FeaturedEngineersSection() {
  return (
    <section>
      {ENGINEERS.map((eng) => (
        <EngineerCard key={eng.id} engineer={eng} />
      ))}
    </section>
  );
}
```

## AFTER (Real API Data)

```typescript
// apps/web/src/app/(public)/_sections/featured-engineers.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { featuredApi } from '@/lib/api';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { Skeleton } from '@/components/ui/skeleton';

export function FeaturedEngineersSection() {
  const { data: engineers, isLoading, error } = useQuery({
    queryKey: ['featuredEngineers'],
    queryFn: () => featuredApi.getEngineers(),
    staleTime: 600000, // 10 minutes
  });

  if (isLoading) {
    return (
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <span className="text-xs font-mono text-accent-cyan uppercase tracking-widest">
              Featured Engineers
            </span>
            <h2 className="font-display text-3xl font-bold text-text-primary mt-1">
              Top Verified AI Talent
            </h2>
          </div>
          <div className="scroll-row pb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-[280px] shrink-0">
                <Skeleton className="h-[240px] w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-text-muted">Failed to load featured engineers</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 text-accent-cyan hover:underline"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!engineers || engineers.length === 0) {
    return (
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-text-muted">No featured engineers available yet</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-6" aria-labelledby="featured-engineers-heading">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-mono text-accent-cyan uppercase tracking-widest">
              Featured Engineers
            </span>
            <h2 id="featured-engineers-heading" className="font-display text-3xl font-bold text-text-primary mt-1">
              Top Verified AI Talent
            </h2>
          </div>
          <Link href="/engineers" className="text-sm text-accent-cyan hover:underline hidden sm:block">
            View all engineers →
          </Link>
        </div>

        <div className="scroll-row pb-4" role="list">
          {engineers.map((eng) => (
            <EngineerCard key={eng.id} engineer={eng} />
          ))}
        </div>
      </div>
    </section>
  );
}

function EngineerCard({ engineer: eng }: { engineer: any }) {
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });

  // Generate initials from name
  const initials = eng.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  // Generate color from name (deterministic)
  const colors = ['#F59E0B', '#00D4FF', '#7B5EA7', '#10B981', '#EF4444'];
  const colorIndex = eng.name.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -4, y: dx * 4 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  const isAvailable = eng.availabilityStatus === 'available_now';

  return (
    <div
      role="listitem"
      className="w-[280px] shrink-0"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/engineer/${eng.id}`} className="block">
        <div
          className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(0,212,255,0.25)] transition-all duration-300 cursor-pointer"
          style={{
            transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
            transition: tilt.x === 0 && tilt.y === 0 ? 'transform 400ms cubic-bezier(0.16,1,0.3,1)' : 'transform 100ms linear',
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="relative">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-sm"
                style={{ background: color }}
                aria-hidden="true"
              >
                {initials}
              </div>
              {isAvailable && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent-green border-2 border-bg-surface"
                  aria-label="Available now"
                />
              )}
            </div>
            <NeuronScoreRing score={eng.neuronScore} size={52} strokeWidth={4} animate={false} />
          </div>

          <h3 className="font-display font-semibold text-text-primary text-sm mb-1">{eng.name}</h3>
          <p className="text-text-muted text-xs leading-relaxed mb-3">{eng.headline}</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {eng.skills.slice(0, 3).map((s: string) => (
              <Badge key={s} variant="gray" className="text-[10px] px-2 py-0.5">{s}</Badge>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-accent-cyan">
              ₹{eng.hourlyRate.toLocaleString('en-IN')}/hr
            </span>
            <span className="text-xs text-text-muted">
              {isAvailable ? 'Available' : 'Busy'}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
```

## Key Changes:

1. **Added React Query** for data fetching
2. **Added Loading State** with skeleton loaders
3. **Added Error State** with retry button
4. **Added Empty State** for no data
5. **Removed Mock Data** - now fetches from API
6. **Dynamic Initials** - generated from name
7. **Dynamic Colors** - deterministic from name
8. **Real Data Mapping** - uses actual API response fields

## API Response Structure:

```typescript
// GET /api/featured/engineers returns:
[
  {
    id: "uuid",
    name: "Arjun Sharma",
    headline: "Senior AI engineer specialising in LLM applications...",
    location: "Bengaluru, India",
    neuronScore: 820,
    neuronTier: "elite",
    hourlyRate: 4500,
    availabilityStatus: "available_now",
    skills: ["Python", "LangChain", "OpenAI API"],
    rating: 4.8,
    reviewCount: 3,
    completedProjects: 2,
    productsPublished: 1
  }
]
```

## Testing:

1. **With Data:**
   ```bash
   cd apps/api && npm run seed:fresh
   ```
   - Should show 6 engineers
   - All data should be real from seed

2. **Loading State:**
   - Throttle network to 3G in DevTools
   - Should show 4 skeleton cards

3. **Error State:**
   - Stop API server
   - Should show error message with retry button

4. **Empty State:**
   - Clear database
   - Should show "No featured engineers" message

## Apply This Pattern To:

- [ ] Hero section stats
- [ ] Featured products section
- [ ] Featured bounties section
- [ ] Engineer dashboard
- [ ] Company dashboard
- [ ] Admin dashboard
- [ ] All other pages with mock data
