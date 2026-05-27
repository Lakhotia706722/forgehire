'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/payments-analytics-data';
import { useMarketRates } from '@/lib/api-hooks';

export default function MarketRatesPage() {
  const { data, isLoading, isError } = useMarketRates();
  const skills = React.useMemo(() => data?.bySkill ?? [], [data?.bySkill]);
  const [selectedSkill, setSelectedSkill] = React.useState<string>('');
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    if (skills.length && !selectedSkill) {
      setSelectedSkill(skills[0].skill);
    }
  }, [skills, selectedSkill]);

  const marketRate = skills.find((s) => s.skill === selectedSkill);

  const filteredSkills = skills.filter((s) =>
    s.skill.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-12 space-y-8">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-3">
            Market Rate Intelligence
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Real-time hourly rate data for AI/ML skills on NeuronHire
          </p>
          <Badge variant="cyan" className="mt-4">Updated from live profiles</Badge>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : isError || skills.length === 0 ? (
          <div className="text-center py-20 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl">
            <p className="text-text-muted text-sm">
              Market rate data will appear once enough engineer profiles are published.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
              <label className="block text-sm font-medium text-text-secondary mb-3">Select Skill</label>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills..."
                className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] mb-3"
              />
              <div className="flex flex-wrap gap-2">
                {filteredSkills.map((item) => (
                  <button
                    key={item.skill}
                    onClick={() => setSelectedSkill(item.skill)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      selectedSkill === item.skill
                        ? 'bg-accent-cyan text-bg-base'
                        : 'bg-bg-elevated text-text-secondary hover:text-text-primary border border-[rgba(255,255,255,0.06)]'
                    )}
                  >
                    {item.skill}
                  </button>
                ))}
              </div>
            </div>

            {marketRate && (
              <>
                <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                  <h2 className="font-display font-semibold text-text-primary text-lg mb-6">
                    Hourly Rate Range for {marketRate.skill}
                  </h2>
                  <p className="text-xs text-text-muted mb-6">Based on {marketRate.sampleSize} engineer profiles</p>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-bg-elevated rounded-xl">
                      <p className="text-xs text-text-muted mb-1">Entry Level (P10)</p>
                      <p className="font-mono font-bold text-lg text-text-primary">{formatCurrency(marketRate.p10)}</p>
                    </div>
                    <div className="text-center p-4 bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.2)] rounded-xl">
                      <p className="text-xs text-accent-cyan mb-1">Market Median</p>
                      <p className="font-mono font-bold text-2xl text-accent-cyan">{formatCurrency(marketRate.median)}</p>
                    </div>
                    <div className="text-center p-4 bg-bg-elevated rounded-xl">
                      <p className="text-xs text-text-muted mb-1">Expert Level (P90)</p>
                      <p className="font-mono font-bold text-lg text-text-primary">{formatCurrency(marketRate.p90)}</p>
                    </div>
                  </div>
                </div>

                {(marketRate.tierBreakdown ?? []).length > 0 && (
                  <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                    <h2 className="font-display font-semibold text-text-primary text-lg mb-6">
                      Rate by NeuronScore Tier
                    </h2>
                    <div className="space-y-4">
                      {(marketRate.tierBreakdown ?? []).map((tier) => (
                        <div key={tier.tier} className="flex items-center gap-4">
                          <div className="w-32 shrink-0">
                            <Badge variant="gray">{tier.tier}</Badge>
                          </div>
                          <div className="flex-1">
                            <div className="relative h-8 rounded-lg overflow-hidden">
                              <progress
                                className="progress-tier"
                                value={marketRate.p90 > 0 ? (tier.avgRate / marketRate.p90) * 100 : 0}
                                max={100}
                                aria-label={`${tier.tier} average rate`}
                              />
                              <span className="absolute inset-y-0 right-3 flex items-center text-xs font-mono font-semibold text-bg-base pointer-events-none">
                                {formatCurrency(tier.avgRate)}/hr
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {marketRate.relatedSkills.length > 0 && (
                  <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                    <h2 className="font-display font-semibold text-text-primary text-lg mb-4">Related Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {(marketRate.relatedSkills ?? []).map((skill) => (
                        <button
                          key={skill}
                          onClick={() => {
                            if (skills.some((s) => s.skill === skill)) setSelectedSkill(skill);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-bg-elevated text-text-secondary hover:text-accent-cyan text-sm border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,212,255,0.2)] transition-all"
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        <div className="text-center text-xs text-text-muted max-w-2xl mx-auto">
          <p>
            Rates are based on verified engineer profiles on NeuronHire. Data is anonymized and aggregated.
            Individual rates may vary based on experience, project complexity, and other factors.
          </p>
        </div>
      </div>
    </div>
  );
}
