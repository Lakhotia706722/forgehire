'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge, TierBadge } from '@/components/ui/badge';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { Skeleton } from '@/components/ui/skeleton';
import { HireModal } from '../_components/hire-modal';

const MOCK_ENGINEER = {
  id: 'e1',
  name: 'Arjun Sharma',
  initials: 'AS',
  color: '#F59E0B',
  headline: 'LLM Engineer · RAG Systems · Agentic AI',
  bio: 'Specialized in building production-grade LLM applications with a focus on RAG pipelines, multi-agent systems, and LLM evaluation frameworks. 5+ years of experience shipping AI products at scale.',
  location: 'Bangalore, India',
  neuronScore: 920,
  neuronTier: 'Elite' as const,
  hourlyRateINR: 5000,
  availability: 'available_now',
  skills: ['LangChain', 'PyTorch', 'FastAPI', 'LlamaIndex', 'OpenAI', 'Pinecone'],
  rating: 4.9,
  reviewCount: 18,
  completedProjects: 12,
  responseRate: 98,
  onTimeDelivery: 100,
};

export default function CompanyEngineerViewPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = React.useState(true);
  const [showHireModal, setShowHireModal] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-8">
            <div className="flex items-start gap-6">
              <Skeleton circle className="w-20 h-20" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/company/browse" className="hover:text-text-secondary">Browse Engineers</Link>
          <span>/</span>
          <span className="text-text-secondary">{MOCK_ENGINEER.name}</span>
        </div>

        {/* Hero */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-display font-bold text-bg-base text-2xl shrink-0" style={{ background: MOCK_ENGINEER.color }} aria-hidden="true">
              {MOCK_ENGINEER.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-display text-2xl font-bold text-text-primary">{MOCK_ENGINEER.name}</h1>
                <TierBadge tier={MOCK_ENGINEER.neuronTier} />
              </div>
              <p className="text-text-secondary text-sm mb-3">{MOCK_ENGINEER.headline}</p>
              <div className="flex flex-wrap gap-4 text-xs text-text-muted mb-4">
                <span>📍 {MOCK_ENGINEER.location}</span>
                <span className="text-accent-green">● Available Now</span>
                <span>₹{MOCK_ENGINEER.hourlyRateINR.toLocaleString('en-IN')}/hr</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {MOCK_ENGINEER.skills.map((skill) => (
                  <Badge key={skill} variant="gray">{skill}</Badge>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <NeuronScoreRing score={MOCK_ENGINEER.neuronScore} size={80} strokeWidth={6} animate={false} />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
            <Button size="md" onClick={() => setShowHireModal(true)}>Hire {MOCK_ENGINEER.name.split(' ')[0]}</Button>
            <Button variant="secondary" size="md">Send Message</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Projects Done',   value: MOCK_ENGINEER.completedProjects, color: '#00D4FF' },
            { label: 'Rating',          value: `${MOCK_ENGINEER.rating}★`,      color: '#F59E0B' },
            { label: 'Response Rate',   value: `${MOCK_ENGINEER.responseRate}%`, color: '#10B981' },
            { label: 'On-time',         value: `${MOCK_ENGINEER.onTimeDelivery}%`, color: '#7B5EA7' },
          ].map((stat) => (
            <div key={stat.label} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
              <p className="font-mono font-bold text-xl" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Bio */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-3">About</h2>
          <p className="text-text-secondary text-sm leading-relaxed">{MOCK_ENGINEER.bio}</p>
        </div>
      </div>

      {showHireModal && (
        <HireModal
          open={showHireModal}
          onClose={() => setShowHireModal(false)}
          engineerName={MOCK_ENGINEER.name}
          engineerHourlyRate={MOCK_ENGINEER.hourlyRateINR}
        />
      )}
    </div>
  );
}
