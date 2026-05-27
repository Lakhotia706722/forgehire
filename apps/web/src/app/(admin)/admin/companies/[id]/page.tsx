'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAdminCompanyDetail } from '@/lib/api-hooks';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCompanyDetailPage({ params }: { params: { id: string } }) {
  const { data: company, isLoading } = useAdminCompanyDetail(params.id);

  async function handleSuspend() {
    toast.success('Company suspended');
  }

  if (isLoading || !company) {
    return (
      <div className="min-h-screen bg-bg-base p-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  const initials = String(company.companyName ?? 'C')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/admin/companies" className="hover:text-text-secondary">Companies</Link>
          <span>/</span>
          <span className="text-text-secondary">{company.companyName}</span>
        </div>

        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-bg-base text-xl bg-accent-cyan" aria-hidden="true">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display font-bold text-xl text-text-primary">{company.companyName}</h1>
                {company.websiteVerified && <Badge variant="green">Website ✓</Badge>}
                {company.gstVerified && <Badge variant="cyan">GST ✓</Badge>}
              </div>
              <p className="text-sm text-text-muted">{company.email}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {company.industry} · {company.size} employees · {company.location}
              </p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Trust Score', value: `${company.trustScore}/100`, valueClass: 'stat-value-green' },
            { label: 'Tasks Posted', value: company.taskCount, valueClass: 'stat-value-cyan' },
            { label: 'Contracts', value: company.contractCount, valueClass: 'stat-value-violet' },
            { label: 'Total Spend', value: `₹${(company.totalSpend / 1000).toFixed(0)}K`, valueClass: 'stat-value-amber' },
          ].map((s) => (
            <div key={s.label} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
              <p className={cn('font-mono font-bold text-xl', s.valueClass)}>{s.value}</p>
              <p className="text-xs text-text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <Button variant="danger" size="md" onClick={handleSuspend}>Suspend Company</Button>
      </div>
    </div>
  );
}
