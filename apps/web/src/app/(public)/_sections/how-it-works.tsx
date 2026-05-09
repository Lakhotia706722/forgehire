'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

type Audience = 'engineer' | 'company';

const STEPS: Record<Audience, { num: string; title: string; desc: string }[]> = {
  engineer: [
    { num: '01', title: 'Sign Up Free', desc: 'Create your account in 2 minutes. No credit card required.' },
    { num: '02', title: 'Build Your Profile', desc: 'Showcase projects, skills, and experience. Our AI helps you stand out.' },
    { num: '03', title: 'Pass the Assessment', desc: 'Take our 90-minute AI assessment. Earn your NeuronScore and tier badge.' },
    { num: '04', title: 'Get Hired', desc: 'Companies find you. Apply to bounties. Land full-time roles. Get paid securely.' },
  ],
  company: [
    { num: '01', title: 'Sign Up Free', desc: 'Create your company account. Verify your domain for a trust badge.' },
    { num: '02', title: 'Post or Browse', desc: 'Post a task/bounty or browse 12K+ verified AI engineers by NeuronScore.' },
    { num: '03', title: 'Deposit Escrow', desc: 'Funds are held securely in escrow. Engineers only get paid on delivery.' },
    { num: '04', title: 'Get AI Work Done', desc: 'Review deliverables, approve milestones, and release payment. Simple.' },
  ],
};

export function HowItWorksSection() {
  const [audience, setAudience] = React.useState<Audience>('engineer');
  const sectionRef = useScrollReveal();

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-24 px-6 max-w-7xl mx-auto"
      aria-labelledby="how-it-works-heading"
    >
      {/* Header */}
      <div className="text-center mb-12 scroll-reveal">
        <h2 id="how-it-works-heading" className="font-display text-4xl font-bold text-text-primary mb-4">
          How It Works
        </h2>
        <p className="text-text-secondary max-w-xl mx-auto">
          Whether you&apos;re building or hiring, NeuronHire makes it simple.
        </p>

        {/* Pill tab switcher */}
        <div className="inline-flex items-center gap-1 mt-6 p-1 rounded-full bg-bg-elevated border border-[rgba(255,255,255,0.06)]" role="tablist" aria-label="Audience selector">
          {(['engineer', 'company'] as Audience[]).map((a) => (
            <button
              key={a}
              role="tab"
              aria-selected={audience === a}
              onClick={() => setAudience(a)}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium transition-all duration-200',
                audience === a
                  ? 'bg-accent-cyan text-bg-base shadow-[0_0_12px_rgba(0,212,255,0.3)]'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {a === 'engineer' ? 'For Engineers' : 'For Companies'}
            </button>
          ))}
        </div>
      </div>

      {/* Steps grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" role="tabpanel">
        {STEPS[audience].map((step, i) => (
          <div
            key={`${audience}-${step.num}`}
            className="scroll-reveal relative"
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            {/* Connector line */}
            {i < STEPS[audience].length - 1 && (
              <div
                className="hidden lg:block absolute top-10 left-full w-full h-px z-0"
                style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.2), transparent)' }}
                aria-hidden="true"
              />
            )}

            <div className="relative z-10 p-6 rounded-xl bg-bg-surface border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,212,255,0.2)] transition-all duration-300 hover:-translate-y-0.5 h-full">
              {/* Big number background */}
              <div
                className="font-display font-bold text-[80px] leading-none mb-2 select-none"
                style={{ color: 'rgba(0,212,255,0.08)' }}
                aria-hidden="true"
              >
                {step.num}
              </div>
              <h3 className="font-display font-semibold text-text-primary text-lg mb-2 -mt-4">
                {step.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
