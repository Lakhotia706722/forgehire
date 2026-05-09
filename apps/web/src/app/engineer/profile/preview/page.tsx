'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NeuronScoreRing } from '@/components/ui/neuron-score-ring';
import { TierBadge, Badge } from '@/components/ui/badge';

// Reuse the public profile page content but with an "editing" banner
export default function ProfilePreviewPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Preview banner */}
      <div className="sticky top-0 z-40 bg-[rgba(245,158,11,0.1)] border-b border-[rgba(245,158,11,0.2)] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-accent-amber">👁 PREVIEW MODE</span>
            <span className="text-xs text-text-muted">This is how your profile appears to companies</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/engineer/profile">
              <Button variant="secondary" size="sm">Edit Profile</Button>
            </Link>
            <Link href={`/engineer/arjun-sharma`}>
              <Button variant="ghost" size="sm">View Public →</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Profile content — mirrors public profile */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Hero */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center font-display font-bold text-bg-base text-2xl shrink-0"
              style={{ background: '#F59E0B' }}
              aria-hidden="true"
            >
              AS
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-display text-2xl font-bold text-text-primary">Arjun Sharma</h1>
                <TierBadge tier="Elite" />
              </div>
              <p className="text-text-secondary text-sm mb-3">LLM Engineer · RAG Systems · Agentic AI</p>
              <div className="flex flex-wrap gap-4 text-xs text-text-muted mb-4">
                <span>📍 Bangalore, India</span>
                <span className="text-accent-green">● Available Now</span>
                <span>₹5,000/hr</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['LangChain', 'PyTorch', 'FastAPI', 'LlamaIndex', 'OpenAI'].map((skill) => (
                  <Badge key={skill} variant="gray">{skill}</Badge>
                ))}
              </div>
            </div>

            <div className="shrink-0">
              <NeuronScoreRing score={920} size={80} strokeWidth={6} animate={false} />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-3">About</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            Specialized in building production-grade LLM applications with a focus on RAG pipelines, multi-agent systems, and LLM evaluation frameworks. 4+ years of experience shipping AI products at scale.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Projects Completed', value: '12', color: '#00D4FF' },
            { label: 'Client Rating',       value: '4.9★', color: '#F59E0B' },
            { label: 'Response Rate',       value: '98%', color: '#10B981' },
            { label: 'On-time Delivery',    value: '100%', color: '#7B5EA7' },
          ].map((stat) => (
            <div key={stat.label} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
              <p className="font-mono font-bold text-xl" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA (what companies see) */}
        <div className="bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.15)] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-display font-semibold text-text-primary">Interested in working with Arjun?</p>
            <p className="text-text-muted text-sm mt-1">Send a message request or post a bounty</p>
          </div>
          <div className="flex gap-3">
            <Button size="md" disabled>Message</Button>
            <Button variant="secondary" size="md" disabled>Hire</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
