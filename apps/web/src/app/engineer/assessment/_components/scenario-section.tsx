'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const SCENARIO_PROMPT = `You are the lead AI engineer at a Series B fintech startup. The CTO has asked you to design and implement a fraud detection system that must:

1. Process 50,000 transactions per second in real-time
2. Achieve >99% precision (false positives are very costly — they block legitimate transactions)
3. Detect novel fraud patterns not seen in training data
4. Explain its decisions to compliance teams
5. Be deployed on AWS with a budget of $5,000/month

The current rule-based system has 94% precision but misses 30% of fraud.

**Your task:** Write a detailed technical proposal covering:
- Architecture design (model choice, data pipeline, serving infrastructure)
- How you would handle the precision vs recall tradeoff
- Explainability approach
- Deployment and monitoring strategy
- Estimated timeline and team requirements`;

const MIN_WORDS = 200;

interface ScenarioSectionProps {
  text: string;
  onChange: (text: string) => void;
}

export function ScenarioSection({ text, onChange }: ScenarioSectionProps) {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const progress = Math.min((wordCount / MIN_WORDS) * 100, 100);
  const meetsMinimum = wordCount >= MIN_WORDS;

  return (
    <div className="flex flex-col h-full p-6 max-w-4xl mx-auto w-full">
      {/* Scenario prompt */}
      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono text-accent-violet bg-[rgba(123,94,167,0.1)] px-2 py-0.5 rounded">
            Scenario
          </span>
          <span className="text-xs text-text-muted">Read carefully before answering</span>
        </div>
        <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
          {SCENARIO_PROMPT}
        </div>
      </div>

      {/* Response area */}
      <div className="flex-1 flex flex-col">
        <label className="block text-sm font-medium text-text-secondary mb-2" htmlFor="scenario-response">
          Your Response
        </label>
        <textarea
          id="scenario-response"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your technical proposal here..."
          className="flex-1 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)] resize-none transition-all leading-relaxed"
          style={{ minHeight: '240px' }}
          aria-describedby="word-count-info"
        />

        {/* Word count + progress */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div id="word-count-info" className="flex items-center gap-2">
              <span className={cn(
                'font-mono text-sm font-semibold transition-colors',
                meetsMinimum ? 'text-accent-green' : 'text-text-secondary'
              )}>
                {wordCount}
              </span>
              <span className="text-xs text-text-muted">/ {MIN_WORDS} words minimum</span>
            </div>
            {meetsMinimum && (
              <span className="text-xs text-accent-green flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm3.707-9.293a1 1 0 00-1.414-1.414L5 9.586 3.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Minimum met
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                meetsMinimum ? 'bg-accent-green' : 'bg-accent-cyan'
              )}
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={wordCount}
              aria-valuemin={0}
              aria-valuemax={MIN_WORDS}
              aria-label="Word count progress"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
