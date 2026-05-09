import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Project } from '@/lib/mock-data';

const TYPE_VARIANT = {
  Agent: 'violet',
  SaaS:  'cyan',
  API:   'green',
  Tool:  'amber',
  Model: 'red',
} as const;

interface TabProjectsProps {
  projects: Project[];
}

export function TabProjects({ projects }: TabProjectsProps) {
  return (
    <div className="masonry-grid" data-testid="projects-masonry">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

function ProjectCard({ project: p }: { project: Project }) {
  return (
    <article className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden hover:border-[rgba(0,212,255,0.3)] hover:-translate-y-1 transition-all duration-300 group">
      {/* Thumbnail */}
      <div
        className={`relative h-40 bg-gradient-to-br ${p.thumbnailGradient} overflow-hidden`}
        aria-hidden="true"
      >
        <div className="absolute inset-0 geo-pattern opacity-40" />
        {/* Type badge — top-left of image */}
        <div className="absolute top-3 left-3 z-10">
          <Badge variant={TYPE_VARIANT[p.type]} className="text-[10px]">
            {p.type}
          </Badge>
        </div>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-bg-elevated/80 border border-[rgba(255,255,255,0.1)] flex items-center justify-center backdrop-blur-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display font-semibold text-text-primary text-sm mb-2 group-hover:text-accent-cyan transition-colors leading-snug">
          {p.title}
        </h3>
        <p className="text-text-muted text-xs leading-relaxed mb-3">{p.description}</p>

        {/* Tech stack */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {p.techStack.map((t) => (
            <Badge key={t} variant="gray" className="text-[10px] px-2 py-0.5">{t}</Badge>
          ))}
        </div>

        {/* Metrics */}
        <div className="flex gap-4 mb-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
          {p.metrics.map((m) => (
            <div key={m.label}>
              <p className="font-mono text-xs font-semibold text-accent-cyan">{m.value}</p>
              <p className="text-[10px] text-text-muted">{m.label}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex gap-2">
          {p.demoUrl && (
            <a
              href={p.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-xs py-2 rounded-lg border border-[rgba(0,212,255,0.3)] text-accent-cyan hover:bg-[rgba(0,212,255,0.05)] transition-colors font-medium"
            >
              Try Demo ↗
            </a>
          )}
          <button className="flex-1 text-xs py-2 rounded-lg bg-[rgba(0,212,255,0.08)] text-accent-cyan hover:bg-[rgba(0,212,255,0.15)] transition-colors font-medium border border-[rgba(0,212,255,0.15)]">
            Hire for This
          </button>
        </div>
      </div>
    </article>
  );
}
