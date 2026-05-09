import { Badge } from '@/components/ui/badge';
import type { Experience } from '@/lib/mock-data';

interface TabExperienceProps {
  experiences: Experience[];
}

export function TabExperience({ experiences }: TabExperienceProps) {
  return (
    <div className="relative space-y-0" role="list" aria-label="Work experience">
      {/* Vertical timeline line */}
      <div
        className="absolute left-[11px] top-3 bottom-3 w-px bg-[rgba(255,255,255,0.06)]"
        aria-hidden="true"
      />

      {experiences.map((exp, i) => (
        <ExperienceEntry key={exp.id} exp={exp} isLast={i === experiences.length - 1} />
      ))}
    </div>
  );
}

function ExperienceEntry({ exp, isLast }: { exp: Experience; isLast: boolean }) {
  return (
    <div className="relative flex gap-6 pb-8" role="listitem">
      {/* Timeline dot */}
      <div className="relative z-10 shrink-0 mt-1">
        <div
          className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: exp.accentColor, background: `${exp.accentColor}20` }}
          aria-hidden="true"
        >
          <div className="w-2 h-2 rounded-full" style={{ background: exp.accentColor }} />
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 bg-bg-surface border rounded-xl p-5 hover:border-[rgba(255,255,255,0.1)] transition-colors"
        style={{ borderColor: `${exp.accentColor}20` }}
      >
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-display font-semibold text-text-primary text-sm">{exp.company}</h3>
              {exp.verified && (
                <span title="Verified company" aria-label="Verified company">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="#00D4FF" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </span>
              )}
            </div>
            <p className="text-text-secondary text-sm">{exp.role}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-text-muted">
              {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
            </p>
            {exp.current && (
              <Badge variant="green" className="text-[10px] mt-1">Current</Badge>
            )}
          </div>
        </div>

        <p className="text-text-secondary text-sm leading-relaxed mb-3">{exp.description}</p>

        {/* Impact pills */}
        <div className="flex flex-wrap gap-2">
          {exp.impact.map((item) => (
            <span
              key={item}
              className="text-xs font-mono px-2.5 py-1 rounded-full"
              style={{
                background: `${exp.accentColor}12`,
                color: exp.accentColor,
                border: `1px solid ${exp.accentColor}30`,
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
