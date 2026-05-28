'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { TechCategory } from '@/lib/mock-data';

interface TabTechStackProps {
  techStack: TechCategory[];
}

export function TabTechStack({ techStack }: TabTechStackProps) {
  if (!techStack.length) {
    return (
      <div className="text-center py-16 text-text-muted">
        <p className="text-sm">No tech stack data available yet.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {techStack.map((cat) => (
        <TechCategoryCard key={cat.category} category={cat} />
      ))}
    </div>
  );
}

function ProficiencyDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-0.5" aria-label={`Proficiency: ${level} of 3`}>
      {[1, 2, 3].map((d) => (
        <div
          key={d}
          className={cn(
            'w-1.5 h-1.5 rounded-full transition-colors',
            d <= level ? 'bg-accent-cyan' : 'bg-[rgba(255,255,255,0.1)]'
          )}
        />
      ))}
    </div>
  );
}

function TechCategoryCard({ category: cat }: { category: TechCategory }) {
  const [tooltip, setTooltip] = React.useState<string | null>(null);

  return (
    <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
      <h3 className="font-display font-semibold text-text-primary text-sm mb-4 pb-3 border-b border-[rgba(255,255,255,0.06)]">
        {cat.category}
      </h3>
      <div className="space-y-3">
        {cat.skills.map((skill) => (
          <div
            key={skill.name}
            className="relative group"
            onMouseEnter={() => setTooltip(skill.name)}
            onMouseLeave={() => setTooltip(null)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                  {skill.name}
                </span>
                {skill.verified && (
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="#00D4FF" aria-label="Platform verified">
                    <title>Platform verified</title>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-text-muted">{skill.projectCount}p</span>
                <ProficiencyDots level={skill.proficiency} />
              </div>
            </div>

            {/* Tooltip */}
            {tooltip === skill.name && (
              <div
                className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-bg-elevated border border-[rgba(255,255,255,0.1)] rounded-lg text-xs text-text-secondary whitespace-nowrap z-20 shadow-xl"
                role="tooltip"
              >
                Used in {skill.projectCount} projects
                {skill.verified && ' · Platform verified'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
