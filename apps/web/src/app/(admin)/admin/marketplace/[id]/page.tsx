'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAdminProductDetail, useAdminProductDecision } from '@/lib/api-hooks';

const CATEGORY_LABELS: Record<string, string> = {
  ai_agents: 'AI Agents',
  fine_tuned_models: 'Fine-tuned Models',
  saas_tools: 'SaaS Tools',
  automation_workflows: 'Automation',
  datasets_prompts: 'Datasets',
  apis_microservices: 'APIs',
};

export default function AdminMarketplaceDetailPage({ params }: { params: { id: string } }) {
  const { data: product, isLoading, error } = useAdminProductDetail(params.id);
  const decision = useAdminProductDecision();
  const [notes, setNotes] = React.useState('');

  async function handleDecision(d: 'approve' | 'reject' | 'request_changes') {
    try {
      await decision.mutateAsync({ productId: params.id, decision: d, notes });
      const messages = {
        approve: 'Product approved and published',
        reject: 'Product rejected',
        request_changes: 'Changes requested from engineer',
      };
      toast.success(messages[d]);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update product');
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
          <Skeleton className="h-4 w-48" />
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
            <div className="flex items-center gap-3">
              <Skeleton circle className="w-8 h-8" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Failed to load product details</p>
          <Link href="/admin/marketplace" className="mt-4 text-accent-cyan hover:underline text-sm block">
            ← Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  const initials = product.engineerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const categoryLabel = CATEGORY_LABELS[product.category] || product.category;

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/admin/marketplace" className="hover:text-text-secondary">Marketplace</Link>
          <span>/</span>
          <span className="text-text-secondary">{product.name}</span>
        </div>

        {/* Header */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display font-bold text-xl text-text-primary">{product.name}</h1>
                <Badge variant="amber">Pending Review</Badge>
                <Badge variant="gray">{categoryLabel}</Badge>
              </div>
              <p className="text-sm text-text-muted">{product.tagline}</p>
            </div>
            <p className="font-mono font-bold text-accent-amber text-xl">
              ₹{product.priceINR.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs bg-[#F59E0B]" aria-hidden="true">
              {initials}
            </div>
            <div>
              <p className="text-sm text-text-primary">{product.engineerName}</p>
              <p className="text-xs text-text-muted">
                Submitted {new Date(product.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-semibold text-text-primary text-lg">Product Details</h2>
          <p className="text-sm text-text-secondary leading-relaxed">{product.description}</p>
          {product.techStack && Array.isArray(product.techStack) && product.techStack.length > 0 && (
            <div>
              <p className="text-xs text-text-muted mb-2">Tech Stack</p>
              <div className="flex flex-wrap gap-2">
                {(product.techStack as string[]).map((tech) => (
                  <Badge key={tech} variant="gray">{tech}</Badge>
                ))}
              </div>
            </div>
          )}
          {product.demoUrl && (
            <a href={product.demoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-cyan hover:underline">
              🔗 View Demo →
            </a>
          )}
        </div>

        {/* Previous moderation notes */}
        {product.moderationNotes && (
          <div className="bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.2)] rounded-2xl p-5">
            <h2 className="font-display font-semibold text-accent-amber mb-2">Previous Moderation Notes</h2>
            <p className="text-sm text-text-secondary">{product.moderationNotes}</p>
          </div>
        )}

        {/* Moderation decision */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-semibold text-text-primary text-lg">Moderation Decision</h2>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Notes (sent to engineer if rejected)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add moderation notes..."
              className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" size="md" loading={decision.isPending} onClick={() => handleDecision('approve')}>✓ Approve &amp; Publish</Button>
            <Button variant="secondary" size="md" onClick={() => handleDecision('request_changes')}>Request Changes</Button>
            <Button variant="danger" size="md" onClick={() => handleDecision('reject')}>Reject</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
