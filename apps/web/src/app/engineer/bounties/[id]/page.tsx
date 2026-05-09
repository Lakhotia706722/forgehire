'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ActionPanel } from './_components/action-panel';
import { NDAModal } from './_components/nda-modal';
import { MiniGateModal } from './_components/mini-gate-modal';
import { MOCK_BOUNTY_DETAIL, formatReward } from '@/lib/bounty-data';

const ENGINEER_SCORE = 920;

const TYPE_COLORS = {
  Bounty:  'text-accent-cyan bg-[rgba(0,212,255,0.1)] border-[rgba(0,212,255,0.2)]',
  Direct:  'text-accent-violet bg-[rgba(123,94,167,0.15)] border-[rgba(123,94,167,0.3)]',
  Contest: 'text-accent-amber bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
};

export default function BountyDetailPage({ params }: { params: { id: string } }) {
  const bounty = MOCK_BOUNTY_DETAIL; // In production: fetch by params.id
  const [showNDA, setShowNDA] = React.useState(false);
  const [showMiniGate, setShowMiniGate] = React.useState(false);
  const [participated, setParticipated] = React.useState(false);
  const [qaInput, setQaInput] = React.useState('');

  const isEligible = ENGINEER_SCORE >= bounty.minNeuronScore;

  function handleParticipate() {
    if (!isEligible) { setShowMiniGate(true); return; }
    if (bounty.ndaRequired) { setShowNDA(true); return; }
    setParticipated(true);
  }

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Breadcrumb */}
      <div className="border-b border-[rgba(255,255,255,0.06)] bg-bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-xs text-text-muted">
          <Link href="/engineer/bounties" className="hover:text-text-secondary transition-colors">Bounties</Link>
          <span>/</span>
          <span className="text-text-secondary truncate max-w-xs">{bounty.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Left panel ──────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs"
                    style={{ background: bounty.companyColor }}
                    aria-hidden="true"
                  >
                    {bounty.companyInitials}
                  </div>
                  <span className="text-sm text-text-secondary">{bounty.company}</span>
                  {bounty.companyVerified && (
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="#00D4FF" aria-label="Verified">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
                <span className={cn('text-xs font-mono px-2.5 py-0.5 rounded-full border', TYPE_COLORS[bounty.type])}>
                  {bounty.type}
                </span>
                {bounty.ndaRequired && (
                  <Badge variant="violet">NDA Required</Badge>
                )}
              </div>

              <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary leading-tight mb-4">
                {bounty.title}
              </h1>

              {/* AI quality score */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted">Task Quality</span>
                <div className="flex-1 max-w-48 h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-cyan rounded-full"
                    style={{ width: `${(bounty.aiPostingQuality / 10) * 100}%` }}
                    role="progressbar"
                    aria-valuenow={bounty.aiPostingQuality}
                    aria-valuemin={0}
                    aria-valuemax={10}
                    aria-label={`Task quality: ${bounty.aiPostingQuality}/10`}
                  />
                </div>
                <span className="text-xs font-mono text-accent-cyan">{bounty.aiPostingQuality}/10</span>
              </div>
            </div>

            {/* Problem statement */}
            <Section title="Problem Statement">
              <p className="text-text-secondary text-sm leading-relaxed">{bounty.problemStatement}</p>
            </Section>

            {/* Current state */}
            <Section title="Current State">
              <p className="text-text-secondary text-sm leading-relaxed">{bounty.currentState}</p>
            </Section>

            {/* Expected outcome */}
            <Section title="Expected Outcome">
              <p className="text-text-secondary text-sm leading-relaxed mb-3">{bounty.expectedOutcome}</p>
              <ul className="space-y-2">
                {bounty.successCriteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" aria-hidden="true">
                      <path d="M2 8l4 4 8-8"/>
                    </svg>
                    {c}
                  </li>
                ))}
              </ul>
            </Section>

            {/* Deliverables */}
            <Section title="Deliverables">
              <div className="space-y-3">
                {bounty.deliverables.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-bg-elevated rounded-xl border border-[rgba(255,255,255,0.04)]">
                    <div className="w-6 h-6 rounded-lg bg-[rgba(0,212,255,0.1)] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-mono text-accent-cyan">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{d.title}</p>
                      <p className="text-xs text-text-muted mt-0.5">{d.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Tech requirements */}
            <Section title="Tech Requirements">
              <div className="flex flex-wrap gap-2">
                {bounty.techRequirements.map((t) => (
                  <Badge key={t} variant="gray">{t}</Badge>
                ))}
              </div>
            </Section>

            {/* Access provided */}
            <Section title="Access Provided">
              <ul className="space-y-1.5">
                {bounty.accessProvided.map((a, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-accent-green" aria-hidden="true">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </Section>

            {/* AI Intelligence panel */}
            <div className="bg-[rgba(123,94,167,0.06)] border border-[rgba(123,94,167,0.2)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="#7B5EA7" aria-hidden="true">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm font-medium text-accent-violet">AI Task Intelligence</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Estimated Timeline</p>
                  <p className="font-mono text-text-primary">{bounty.aiEstimatedDays[0]}–{bounty.aiEstimatedDays[1]} days</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Suggested Reward</p>
                  <p className="font-mono text-text-primary">
                    {formatReward(bounty.aiSuggestedReward[0])}–{formatReward(bounty.aiSuggestedReward[1])}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Recommended Type</p>
                  <p className="font-mono text-text-primary">{bounty.aiRecommendedType}</p>
                </div>
              </div>
            </div>

            {/* Q&A */}
            <Section title="Questions & Answers">
              <div className="space-y-4 mb-4">
                {bounty.questions.map((qa) => (
                  <div key={qa.id} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-bg-elevated border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[10px] font-mono text-text-muted shrink-0">
                        Q
                      </div>
                      <div>
                        <p className="text-sm text-text-primary">{qa.question}</p>
                        <p className="text-[10px] text-text-muted font-mono mt-0.5">{qa.askedBy} · {qa.askedAt}</p>
                      </div>
                    </div>
                    {qa.answer && (
                      <div className="flex items-start gap-2 ml-8">
                        <div className="w-6 h-6 rounded-full bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center text-[10px] font-mono text-accent-cyan shrink-0">
                          A
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary">{qa.answer}</p>
                          <p className="text-[10px] text-text-muted font-mono mt-0.5">{bounty.company} · {qa.answeredAt}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Ask a question */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  placeholder="Ask a public question..."
                  className="flex-1 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-all"
                />
                <button
                  disabled={!qaInput.trim()}
                  className="px-4 py-2.5 rounded-lg bg-accent-cyan text-bg-base text-sm font-semibold disabled:opacity-40 hover:brightness-110 transition-all"
                >
                  Ask
                </button>
              </div>
            </Section>
          </div>

          {/* ── Right panel (sticky) ─────────────────────── */}
          <div className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-8">
              <ActionPanel
                bounty={bounty}
                engineerScore={ENGINEER_SCORE}
                onParticipate={handleParticipate}
                participated={participated}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NDAModal
        open={showNDA}
        onClose={() => setShowNDA(false)}
        onSigned={() => { setShowNDA(false); setParticipated(true); }}
        taskTitle={bounty.title}
      />
      <MiniGateModal
        open={showMiniGate}
        onClose={() => setShowMiniGate(false)}
        onPass={() => { setShowMiniGate(false); handleParticipate(); }}
        requiredScore={bounty.minNeuronScore}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pb-8 border-b border-[rgba(255,255,255,0.06)] last:border-0 last:pb-0">
      <h2 className="font-display font-semibold text-text-primary text-base mb-4">{title}</h2>
      {children}
    </div>
  );
}
