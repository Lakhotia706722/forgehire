'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { MOCK_MARKET_RATES, formatCurrency, type MarketRate } from '@/lib/payments-analytics-data';

const AVAILABLE_SKILLS = Object.keys(MOCK_MARKET_RATES);

export default function MarketRatesPage() {
  const [selectedSkill, setSelectedSkill] = React.useState<string>(AVAILABLE_SKILLS[0]);
  const [searchQuery, setSearchQuery] = React.useState('');

  const marketRate = MOCK_MARKET_RATES[selectedSkill];

  const filteredSkills = AVAILABLE_SKILLS.filter((skill) =>
    skill.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-12 space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-3">
            Market Rate Intelligence
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Real-time hourly rate data for AI/ML skills on NeuronHire
          </p>
          <Badge variant="cyan" className="mt-4">Updated Weekly</Badge>
        </div>

        {/* Skill Selector */}
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
            {filteredSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(skill)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  selectedSkill === skill
                    ? 'bg-accent-cyan text-bg-base'
                    : 'bg-bg-elevated text-text-secondary hover:text-text-primary border border-[rgba(255,255,255,0.06)]'
                )}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {marketRate && (
          <>
            {/* Rate Range Visualization */}
            <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
              <h2 className="font-display font-semibold text-text-primary text-lg mb-6">
                Hourly Rate Range for {marketRate.skill}
              </h2>

              {/* Range Bar */}
              <div className="relative mb-8">
                <div className="h-3 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[rgba(0,212,255,0.3)] via-accent-cyan to-[rgba(0,212,255,0.3)] rounded-full"
                    style={{
                      marginLeft: `${(marketRate.p10 / marketRate.p90) * 100}%`,
                      width: `${((marketRate.p90 - marketRate.p10) / marketRate.p90) * 100}%`,
                    }}
                  />
                </div>

                {/* Percentile Markers */}
                <div className="relative mt-4">
                  {[
                    { label: 'P10', value: marketRate.p10, pos: 10 },
                    { label: 'P25', value: marketRate.p25, pos: 25 },
                    { label: 'Median', value: marketRate.median, pos: 50 },
                    { label: 'P75', value: marketRate.p75, pos: 75 },
                    { label: 'P90', value: marketRate.p90, pos: 90 },
                  ].map((p) => (
                    <div
                      key={p.label}
                      className="absolute -translate-x-1/2"
                      style={{ left: `${p.pos}%` }}
                    >
                      <div className="w-px h-4 bg-accent-cyan mb-2" />
                      <div className="text-center">
                        <p className="text-xs text-text-muted mb-1">{p.label}</p>
                        <p className="text-sm font-mono font-semibold text-accent-cyan">
                          {formatCurrency(p.value)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mt-12">
                <div className="text-center p-4 bg-bg-elevated rounded-xl">
                  <p className="text-xs text-text-muted mb-1">Entry Level</p>
                  <p className="font-mono font-bold text-lg text-text-primary">{formatCurrency(marketRate.p10)}</p>
                </div>
                <div className="text-center p-4 bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.2)] rounded-xl">
                  <p className="text-xs text-accent-cyan mb-1">Market Median</p>
                  <p className="font-mono font-bold text-2xl text-accent-cyan">{formatCurrency(marketRate.median)}</p>
                </div>
                <div className="text-center p-4 bg-bg-elevated rounded-xl">
                  <p className="text-xs text-text-muted mb-1">Expert Level</p>
                  <p className="font-mono font-bold text-lg text-text-primary">{formatCurrency(marketRate.p90)}</p>
                </div>
              </div>
            </div>

            {/* NeuronScore Tier Breakdown */}
            <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
              <h2 className="font-display font-semibold text-text-primary text-lg mb-6">
                Rate by NeuronScore Tier
              </h2>
              <div className="space-y-4">
                {marketRate.tierBreakdown.map((tier) => (
                  <div key={tier.tier} className="flex items-center gap-4">
                    <div className="w-32 shrink-0">
                      <Badge
                        variant={
                          tier.tier === 'Elite' ? 'amber' :
                          tier.tier === 'Professional' ? 'cyan' :
                          tier.tier === 'Verified' ? 'violet' : 'gray'
                        }
                      >
                        {tier.tier}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <div className="h-8 bg-[rgba(255,255,255,0.06)] rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent-cyan to-[rgba(0,212,255,0.5)] rounded-lg flex items-center justify-end pr-3 transition-all duration-700"
                          style={{ width: `${(tier.avgRate / marketRate.p90) * 100}%` }}
                        >
                          <span className="text-xs font-mono font-semibold text-bg-base">
                            {formatCurrency(tier.avgRate)}/hr
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Skills */}
            <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
              <h2 className="font-display font-semibold text-text-primary text-lg mb-4">
                Related Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {marketRate.relatedSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => {
                      if (MOCK_MARKET_RATES[skill]) {
                        setSelectedSkill(skill);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-bg-elevated text-text-secondary hover:text-accent-cyan text-sm border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,212,255,0.2)] transition-all"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Disclaimer */}
        <div className="text-center text-xs text-text-muted max-w-2xl mx-auto">
          <p>
            Rates are based on actual contracts and job postings on NeuronHire. Data is anonymized and aggregated.
            Individual rates may vary based on experience, project complexity, and other factors.
          </p>
        </div>
      </div>
    </div>
  );
}
