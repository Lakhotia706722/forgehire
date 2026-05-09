import type { Activity } from '@/lib/mock-data';

interface TabActivityProps {
  activities: Activity[];
  engineerInitials: string;
  avatarColor: string;
}

export function TabActivity({ activities, engineerInitials, avatarColor }: TabActivityProps) {
  return (
    <div className="space-y-4" role="feed" aria-label="Build in public activity">
      {activities.map((post, i) => (
        <article
          key={post.id}
          className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 animate-fade-up"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs shrink-0"
              style={{ background: avatarColor }}
              aria-hidden="true"
            >
              {engineerInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-secondary text-sm leading-relaxed mb-3">{post.text}</p>
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span className="font-mono">{post.timestamp}</span>
                <button
                  className="flex items-center gap-1 hover:text-accent-cyan transition-colors"
                  aria-label={`${post.likes} likes`}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 14s-6-3.5-6-8a4 4 0 018 0 4 4 0 018 0c0 4.5-6 8-6 8z"/>
                  </svg>
                  {post.likes}
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
