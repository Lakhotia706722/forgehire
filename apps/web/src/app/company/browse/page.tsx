'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RangeSlider } from '@/components/ui/range-slider';
import { EngineerCard } from './_components/engineer-card';
import { SmartMatchingPanel } from './_components/smart-matching-panel';
import { TrialModal } from './_components/trial-modal';
import { type AvailabilityStatus } from '@/lib/hiring-data';
import { useEngineerSearch } from '@/lib/api-hooks';
import { mapApiSearchEngineer } from '@/lib/map-search-engineer';
import { AriaToggleButton } from '@/components/ui/aria-tab-button';

const SORT_OPTIONS = ['Relevance', 'NeuronScore', 'Rating', 'Hourly Rate', 'Most Reviews'] as const;
type SortOption = typeof SORT_OPTIONS[number];

const AUTOCOMPLETE_SKILLS = [
  'LangChain', 'PyTorch', 'FastAPI', 'LlamaIndex', 'OpenAI', 'HuggingFace',
  'TensorFlow', 'Kubernetes', 'MLflow', 'Pinecone', 'RAG', 'Fine-tuning',
];

export default function BrowseEngineersPage() {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [showAutocomplete, setShowAutocomplete] = React.useState(false);
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([]);
  const [scoreRange, setScoreRange] = React.useState<[number, number]>([0, 1000]);
  const [rateRange, setRateRange] = React.useState<[number, number]>([500, 50000]);
  const [availability, setAvailability] = React.useState<AvailabilityStatus | 'any'>('any');
  const [workMode, setWorkMode] = React.useState<'remote' | 'hybrid' | 'onsite' | 'any'>('any');
  const [sort, setSort] = React.useState<SortOption>('Relevance');
  const [showTrialModal, setShowTrialModal] = React.useState(false);
  const [selectedEngineer, setSelectedEngineer] = React.useState<ReturnType<typeof mapApiSearchEngineer> | null>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();

  const { data: searchResults = [], isLoading: loading } = useEngineerSearch({
    query: debouncedQuery || undefined,
    skills: selectedSkills.length ? selectedSkills : undefined,
    minNeuronScore: scoreRange[0] > 0 ? scoreRange[0] : undefined,
    maxNeuronScore: scoreRange[1] < 1000 ? scoreRange[1] : undefined,
    availabilityStatus: availability !== 'any' ? availability : undefined,
    minHourlyRate: rateRange[0],
    maxHourlyRate: rateRange[1],
  });

  // Debounce search
  React.useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const autocompleteItems = AUTOCOMPLETE_SKILLS.filter(
    (s) => s.toLowerCase().includes(query.toLowerCase()) && query.length > 0
  ).slice(0, 6);

  function addSkill(skill: string) {
    if (!selectedSkills.includes(skill)) setSelectedSkills((prev) => [...prev, skill]);
    setQuery('');
    setShowAutocomplete(false);
  }

  const engineers = React.useMemo(() => {
    let list = (searchResults as Record<string, unknown>[]).map(mapApiSearchEngineer);
    if (workMode !== 'any') list = list.filter((e) => e.workMode === workMode);

    if (sort === 'NeuronScore') list = [...list].sort((a, b) => b.neuronScore - a.neuronScore);
    else if (sort === 'Rating') list = [...list].sort((a, b) => b.rating - a.rating);
    else if (sort === 'Hourly Rate') list = [...list].sort((a, b) => a.hourlyRateINR - b.hourlyRateINR);
    else if (sort === 'Most Reviews') list = [...list].sort((a, b) => b.reviewCount - a.reviewCount);

    return list;
  }, [searchResults, workMode, sort]);

  // Mock: company has an active job posting
  const activeJobId = 'job-1';
  const topMatches = engineers.filter((e) => e.matchScore && e.matchScore >= 80);

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary mb-1">
            Find AI Engineers
          </h1>
          <p className="text-text-secondary text-sm">
            {loading ? '...' : `${engineers.length} verified engineers available`}
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/>
          </svg>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowAutocomplete(true); }}
            onFocus={() => setShowAutocomplete(true)}
            onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
            onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) addSkill(query.trim()); }}
            placeholder="Search by skill, e.g. 'LangChain agent developer'"
            className="w-full bg-bg-surface border border-[rgba(255,255,255,0.08)] rounded-xl pl-12 pr-4 py-4 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.4)] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.08)] transition-all"
            aria-label="Search engineers"
            data-testid="engineer-search-input"
          />

          {/* Autocomplete dropdown */}
          {showAutocomplete && autocompleteItems.length > 0 && (
            <ul
              id="search-autocomplete"
              aria-label="Search suggestions"
              className="absolute top-full left-0 right-0 mt-1 bg-bg-elevated border border-[rgba(255,255,255,0.08)] rounded-xl shadow-xl z-20 overflow-hidden list-none m-0 p-0"
              data-testid="search-autocomplete"
            >
              {autocompleteItems.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onMouseDown={() => addSkill(item)}
                    className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-[rgba(255,255,255,0.04)] transition-colors flex items-center gap-2"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="rgba(0,212,255,0.5)" strokeWidth="1.5" aria-hidden="true">
                      <circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/>
                    </svg>
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-[rgba(255,255,255,0.06)]">
          {/* Selected skill chips */}
          {selectedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedSkills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-[rgba(0,212,255,0.08)] text-accent-cyan border border-[rgba(0,212,255,0.2)]">
                  {s}
                  <button onClick={() => setSelectedSkills((prev) => prev.filter((x) => x !== s))} aria-label={`Remove ${s}`} className="hover:text-accent-red transition-colors">×</button>
                </span>
              ))}
            </div>
          )}

          {/* Score range */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <span className="text-xs text-text-muted whitespace-nowrap">Score:</span>
            <RangeSlider
              min={0} max={1000} step={50}
              value={scoreRange}
              onChange={setScoreRange}
              formatLabel={(v) => String(v)}
              ariaLabel="Neuron score range"
              className="flex-1"
            />
          </div>

          {/* Rate range */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <span className="text-xs text-text-muted whitespace-nowrap">Rate:</span>
            <RangeSlider
              min={500} max={50000} step={500}
              value={rateRange}
              onChange={setRateRange}
              formatLabel={(v) => `₹${(v / 1000).toFixed(0)}K`}
              ariaLabel="Hourly rate range"
              className="flex-1"
            />
          </div>

          {/* Availability pills */}
          <div className="flex gap-1.5" role="group" aria-label="Availability filter">
            {(['available_now', 'within_2_weeks', 'any'] as const).map((a) => (
              <AriaToggleButton
                key={a}
                pressed={availability === a}
                onClick={() => setAvailability(a)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border transition-all',
                  availability === a
                    ? 'bg-[rgba(0,212,255,0.1)] text-accent-cyan border-[rgba(0,212,255,0.3)]'
                    : 'border-[rgba(255,255,255,0.08)] text-text-muted hover:border-[rgba(255,255,255,0.2)]'
                )}
              >
                {a === 'available_now' ? 'Available Now' : a === 'within_2_weeks' ? 'Within 2 weeks' : 'Any'}
              </AriaToggleButton>
            ))}
          </div>

          {/* Work mode pills */}
          <div className="flex gap-1.5" role="group" aria-label="Work mode filter">
            {(['remote', 'hybrid', 'onsite', 'any'] as const).map((m) => (
              <AriaToggleButton
                key={m}
                pressed={workMode === m}
                onClick={() => setWorkMode(m)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border transition-all capitalize',
                  workMode === m
                    ? 'bg-[rgba(0,212,255,0.1)] text-accent-cyan border-[rgba(0,212,255,0.3)]'
                    : 'border-[rgba(255,255,255,0.08)] text-text-muted hover:border-[rgba(255,255,255,0.2)]'
                )}
              >
                {m === 'any' ? 'Any' : m}
              </AriaToggleButton>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-text-muted">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="bg-bg-elevated border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-[rgba(0,212,255,0.3)] [color-scheme:dark]"
              aria-label="Sort engineers"
            >
              {SORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton circle className="w-11 h-11" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton circle className="w-12 h-12" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {[1,2,3].map((j) => <Skeleton key={j} rounded className="h-5 w-16" />)}
                </div>
              </div>
            ))}
          </div>
        ) : engineers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted text-sm">No engineers match your filters.</p>
            <button onClick={() => { setSelectedSkills([]); setAvailability('any'); setWorkMode('any'); }} className="mt-3 text-sm text-accent-cyan hover:underline">
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" role="list" aria-label="Engineer listings">
            {engineers.map((eng) => (
              <div key={eng.id} role="listitem">
                <EngineerCard
                  engineer={eng}
                  onInvite={(id) => router.push(`/company/browse/${id}`)}
                  onMessage={(id) => router.push(`/company/messages/${id}`)}
                  onTrial={() => {
                    setSelectedEngineer(eng);
                    setShowTrialModal(true);
                  }}
                />
              </div>
            ))}
          </div>
        )}
        </div>

        {/* Smart Matching Panel */}
        <aside className="hidden xl:block w-80 shrink-0">
          <div className="sticky top-6">
            <SmartMatchingPanel
              jobId={activeJobId}
              matchedEngineers={topMatches}
              onInvite={(id) => router.push(`/company/browse/${id}`)}
            />
          </div>
        </aside>
      </div>

      {/* Trial Modal */}
      {selectedEngineer && (
        <TrialModal
          open={showTrialModal}
          onClose={() => {
            setShowTrialModal(false);
            setSelectedEngineer(null);
          }}
          engineerName={selectedEngineer.name}
          engineerHourlyRate={selectedEngineer.hourlyRateINR}
        />
      )}
    </div>
  );
}
