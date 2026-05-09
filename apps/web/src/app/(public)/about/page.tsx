import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About NeuronHire — India\'s AI Talent Marketplace',
  description: 'NeuronHire is India\'s only AI-exclusive talent and product marketplace, connecting verified AI engineers with companies building the future.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 space-y-16">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.2)] text-xs font-mono text-accent-cyan mb-4">
            India&apos;s AI-Only Talent Marketplace
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary leading-tight">
            Built for the AI generation
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            NeuronHire is where India&apos;s best AI engineers get verified, discovered, and hired — and where companies find the talent to build their AI future.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 space-y-4">
          <h2 className="font-display text-2xl font-bold text-text-primary">Our Mission</h2>
          <p className="text-text-secondary leading-relaxed">
            India produces some of the world&apos;s best AI engineers, but the existing hiring infrastructure wasn&apos;t built for them. Generic job boards don&apos;t understand LLMs. Freelance platforms don&apos;t verify AI skills. NeuronHire fixes this.
          </p>
          <p className="text-text-secondary leading-relaxed">
            We built a platform where AI engineers are assessed on real skills — not just resumes — and where companies can trust that every engineer they hire has been verified by our NeuronScore system.
          </p>
        </div>

        {/* How it works */}
        <div className="space-y-6">
          <h2 className="font-display text-2xl font-bold text-text-primary">How NeuronHire Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Get Verified', desc: 'Engineers take a rigorous AI assessment covering LLMs, system design, and coding. Your NeuronScore reflects your real capabilities.', color: '#00D4FF' },
              { step: '02', title: 'Get Discovered', desc: 'Companies search our verified talent pool by skill, score, and availability. Your profile does the work for you.', color: '#7B5EA7' },
              { step: '03', title: 'Get Paid', desc: 'Work on bounties, contracts, or full-time roles. Payments are secured in escrow and released on milestone completion.', color: '#F59E0B' },
            ].map((item) => (
              <div key={item.step} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
                <p className="font-mono text-3xl font-bold mb-3" style={{ color: item.color }}>{item.step}</p>
                <h3 className="font-display font-semibold text-text-primary mb-2">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '2,400+', label: 'Verified Engineers', color: '#00D4FF' },
            { value: '180+',   label: 'Companies Hiring',   color: '#7B5EA7' },
            { value: '₹12Cr+', label: 'Paid to Engineers',  color: '#10B981' },
            { value: '94%',    label: 'Hire Success Rate',  color: '#F59E0B' },
          ].map((stat) => (
            <div key={stat.label} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 text-center">
              <p className="font-display font-bold text-2xl" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-text-primary">Ready to join?</h2>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup" className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-accent-cyan text-bg-base font-semibold hover:brightness-110 transition-all">
              Join as Engineer
            </Link>
            <Link href="/signup" className="inline-flex items-center justify-center h-12 px-8 rounded-lg border border-[rgba(123,94,167,0.4)] text-accent-violet hover:bg-[rgba(123,94,167,0.06)] transition-all">
              Hire Engineers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
