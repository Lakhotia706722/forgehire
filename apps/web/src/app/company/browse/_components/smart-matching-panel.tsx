'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { avatarToneClass } from '@/lib/avatar-tone';
import type { SearchEngineer } from '@/lib/hiring-data';

interface SmartMatchingPanelProps {
  jobId?: string;
  matchedEngineers: SearchEngineer[];
  onInvite?: (id: string) => void;
}

export function SmartMatchingPanel({ jobId, matchedEngineers, onInvite }: SmartMatchingPanelProps) {
  const [showTeamBuilder, setShowTeamBuilder] = React.useState(false);
  const [problemInput, setProblemInput] = React.useState('');
  const [teamSuggestions, setTeamSuggestions] = React.useState<SearchEngineer[]>([]);
  const [loading, setLoading] = React.useState(false);

  async function handleTeamBuilder() {
    if (!problemInput.trim()) return;
    setLoading(true);
    // Simulate AI team building
    await new Promise((r) => setTimeout(r, 1500));
    setTeamSuggestions(matchedEngineers.slice(0, 3));
    setLoading(false);
  }

  if (!jobId) {
    return (
      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 text-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3" aria-hidden="true">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
        <p className="text-sm text-text-muted mb-2">Post a job to see AI-matched talent</p>
        <Link href="/company/post-task">
          <Button size="sm" variant="secondary">Post a Job</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] bg-gradient-to-r from-[rgba(0,212,255,0.05)] to-transparent">
          <div className="flex items-center gap-2 mb-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/>
            </svg>
            <h2 className="font-display font-semibold text-text-primary text-sm">AI-Matched Talent</h2>
          </div>
          <p className="text-xs text-text-muted">Top matches for your job posting</p>
        </div>

        {/* Matched engineers */}
        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
          {matchedEngineers.slice(0, 5).map((eng) => (
            <div key={eng.id} className="bg-bg-elevated border border-[rgba(255,255,255,0.04)] rounded-xl p-3 hover:border-[rgba(0,212,255,0.2)] transition-all group">
              <div className="flex items-start gap-3 mb-2">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs shrink-0',
                    avatarToneClass(eng.name),
                  )}
                  aria-hidden="true"
                >
                  {eng.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/engineer/${eng.id}`}>
                    <span className="text-sm font-semibold text-text-primary hover:text-accent-cyan transition-colors line-clamp-1">
                      {eng.name}
                    </span>
                  </Link>
                  <p className="text-xs text-text-muted line-clamp-1">{eng.headline}</p>
                </div>
              </div>

              {/* Match score with mini radar */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8">
                    <svg viewBox="0 0 36 36" className="transform -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="14" fill="none" stroke="#00D4FF" strokeWidth="3"
                        strokeDasharray={`${(eng.matchScore ?? 0) * 0.88} 88`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-accent-cyan">
                      {eng.matchScore}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted">match</span>
                </div>
                <span className="text-xs font-mono text-accent-cyan">₹{eng.hourlyRateINR.toLocaleString('en-IN')}/hr</span>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mb-2">
                {eng.skills.slice(0, 3).map((s) => (
                  <Badge key={s} variant="gray" className="text-[9px] px-1.5 py-0">{s}</Badge>
                ))}
              </div>

              {/* Action */}
              <button
                onClick={() => onInvite?.(eng.id)}
                className="w-full text-xs py-1.5 rounded-lg border border-[rgba(0,212,255,0.3)] text-accent-cyan hover:bg-[rgba(0,212,255,0.05)] transition-all opacity-0 group-hover:opacity-100"
              >
                Invite to Apply
              </button>
            </div>
          ))}
        </div>

        {/* Team builder CTA */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowTeamBuilder(true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[rgba(0,212,255,0.1)] to-[rgba(123,94,167,0.1)] border border-[rgba(0,212,255,0.2)] text-accent-cyan text-sm font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            Instant Team Builder
          </button>
        </div>
      </div>

      {/* Team Builder Modal */}
      <Modal open={showTeamBuilder} onClose={() => setShowTeamBuilder(false)} title="Instant Team Builder" size="lg">
        <div className="p-6 space-y-5">
          <p className="text-sm text-text-secondary">
            Describe a complex problem or project, and our AI will suggest a complementary team of engineers.
          </p>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Problem Description</label>
            <textarea
              value={problemInput}
              onChange={(e) => setProblemInput(e.target.value)}
              rows={4}
              placeholder="e.g., Build a real-time voice AI agent with multilingual support, integrate with Twilio, deploy on AWS with auto-scaling..."
              className="w-full bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none"
            />
          </div>

          <Button
            size="lg"
            className="w-full"
            loading={loading}
            disabled={!problemInput.trim()}
            onClick={handleTeamBuilder}
          >
            Generate Team Suggestions
          </Button>

          {/* Team suggestions */}
          {teamSuggestions.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <h3 className="font-display font-semibold text-text-primary text-sm">Suggested Team</h3>
              {teamSuggestions.map((eng, i) => (
                <div key={eng.id} className="bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-sm shrink-0',
                        avatarToneClass(eng.name),
                      )}
                      aria-hidden="true"
                    >
                      {eng.initials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-text-primary">{eng.name}</span>
                        <Badge variant="cyan" className="text-[9px]">
                          {i === 0 ? 'Lead' : i === 1 ? 'Backend' : 'DevOps'}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-muted mb-2">{eng.headline}</p>
                      <div className="flex flex-wrap gap-1">
                        {eng.skills.slice(0, 4).map((s) => (
                          <Badge key={s} variant="gray" className="text-[9px] px-1.5 py-0">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.04)]">
                    <span className="text-xs font-mono text-accent-cyan">₹{eng.hourlyRateINR.toLocaleString('en-IN')}/hr</span>
                    <button
                      onClick={() => onInvite?.(eng.id)}
                      className="text-xs px-3 py-1 rounded-lg bg-accent-cyan text-bg-base font-semibold hover:brightness-110 transition-all"
                    >
                      Invite
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
