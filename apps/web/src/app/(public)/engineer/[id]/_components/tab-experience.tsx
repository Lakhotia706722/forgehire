import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Experience } from '@/lib/mock-data';

interface TabExperienceProps {
  experiences: Experience[];
}

function experienceToneClass(accentColor: string): string {
  let hash = 0;
  for (let i = 0; i < accentColor.length; i++) {
    hash = accentColor.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `experience-tone-${Math.abs(hash) % 4}`;
}

export function TabExperience({ experiences }: TabExperienceProps) {
  return (
    <div className="relative">
      <div
        className="absolute left-[11px] top-3 bottom-3 w-px bg-[rgba(255,255,255,0.06)]"
        aria-hidden="true"
      />

      <ul className="relative m-0 list-none space-y-0 p-0" aria-label="Work experience">
        {experiences.map((exp) => (
          <ExperienceEntry
            key={exp.id}
            exp={exp}
            toneClass={experienceToneClass(exp.accentColor)}
          />
        ))}
      </ul>
    </div>
  );
}

function ExperienceEntry({ exp, toneClass }: { exp: Experience; toneClass: string }) {
  return (
    <li className={cn('relative flex gap-6 pb-8', toneClass)}>
      <div className="relative z-10 mt-1 shrink-0">
        <div
          className="experience-dot flex h-6 w-6 items-center justify-center rounded-full border-2"
          aria-hidden="true"
        >
          <div className="experience-dot-inner h-2 w-2 rounded-full" />
        </div>
      </div>

      <div className="experience-card flex-1 rounded-xl border bg-bg-surface p-5 transition-colors hover:border-[rgba(255,255,255,0.1)]">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-0.5 flex items-center gap-2">
              <h3 className="font-display text-sm font-semibold text-text-primary">{exp.company}</h3>
              {exp.verified && (
                <span title="Verified company" aria-label="Verified company">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="#00D4FF" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary">{exp.role}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-text-muted">
              {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
            </p>
            {exp.current && (
              <Badge variant="green" className="mt-1 text-[10px]">Current</Badge>
            )}
          </div>
        </div>

        <p className="mb-3 text-sm leading-relaxed text-text-secondary">{exp.description}</p>

        <div className="flex flex-wrap gap-2">
          {exp.impact.map((item) => (
            <span key={item} className="experience-pill rounded-full px-2.5 py-1 font-mono text-xs">
              {item}
            </span>
          ))}
        </div>
      </div>
    </li>
  );
}
