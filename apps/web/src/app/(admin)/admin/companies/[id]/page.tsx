'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const MOCK_COMPANY = {
  id: 'c1',
  companyName: 'Sarvam AI',
  email: 'admin@sarvam.ai',
  initials: 'SA',
  color: '#00D4FF',
  trustScore: 87,
  websiteVerified: true,
  gstVerified: true,
  isHiring: true,
  industry: 'AI/ML',
  size: '51-200',
  location: 'Bangalore, India',
  createdAt: '2026-01-10',
  taskCount: 8,
  contractCount: 5,
  totalSpend: 680000,
};

export default function AdminCompanyDetailPage({ params }: { params: { id: string } }) {
  async function handleSuspend() {
    toast.success('Company suspended');
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/admin/companies" className="hover:text-text-secondary">Companies</Link>
          <span>/</span>
          <span className="text-text-secondary">{MOCK_COMPANY.companyName}</span>
        </div>

        {/* Header */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-bg-base text-xl" style={{ background: MOCK_COMPANY.color }} aria-hidden="true">
              {MOCK_COMPANY.initials}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display font-bold text-xl text-text-primary">{MOCK_COMPANY.companyName}</h1>
                {MOCK_COMPANY.websiteVerified && <Badge variant="green">Website ✓</Badge>}
                {MOCK_COMPANY.gstVerified && <Badge variant="cyan">GST ✓</Badge>}
              </div>
              <p className="text-sm text-text-muted">{MOCK_COMPANY.email}</p>
              <p className="text-xs text-text-muted mt-0.5">{MOCK_COMPANY.industry} · {MOCK_COMPANY.size} employees · {MOCK_COMPANY.location}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Trust Score',   value: `${MOCK_COMPANY.trustScore}/100`, color: '#10B981' },
            { label: 'Tasks Posted',  value: MOCK_COMPANY.taskCount,           color: '#00D4FF' },
            { label: 'Contracts',     value: MOCK_COMPANY.contractCount,       color: '#7B5EA7' },
            { label: 'Total Spend',   value: `₹${(MOCK_COMPANY.totalSpend / 1000).toFixed(0)}K`, color: '#F59E0B' },
          ].map((stat) => (
            <div key={stat.label} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-center">
              <p className="font-mono font-bold text-xl" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Admin actions */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-semibold text-text-primary text-lg">Admin Actions</h2>
          <div className="flex items-center justify-between p-4 bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] rounded-xl">
            <div>
              <p className="text-sm font-medium text-text-primary">Suspend Company</p>
              <p className="text-xs text-text-muted mt-0.5">Disable this company&apos;s account and pause all active tasks</p>
            </div>
            <Button variant="danger" size="sm" onClick={handleSuspend}>Suspend</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
