'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api-fetch';
import {
  formatCurrency,
  getTransactionTypeBadgeVariant,
  type TransactionType,
} from '@/lib/payments-analytics-data';

interface WalletStats {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  monthlyWithdrawal: number;
  currency: string;
}

interface CompanyContractItem {
  id: string;
  title: string;
  status: string;
  totalAmount?: number | null;
  rate: number;
}

interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  createdAt: string;
}

interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  nextCursor: string | null;
}

export default function CompanyBillingPage() {
  const { user, isLoaded } = useUser();

  const walletQuery = useQuery({
    queryKey: ['company', 'billing', 'wallet'],
    queryFn: () => apiFetch<WalletStats>('/api/payments/wallet'),
    enabled: isLoaded && !!user,
    staleTime: 30_000,
  });
  const contractsQuery = useQuery({
    queryKey: ['company', 'billing', 'contracts'],
    queryFn: () =>
      apiFetch<CompanyContractItem[]>('/api/contracts?role=company&status=active'),
    enabled: isLoaded && !!user,
    staleTime: 30_000,
  });
  const txQuery = useQuery({
    queryKey: ['company', 'billing', 'transactions'],
    queryFn: () =>
      apiFetch<WalletTransactionsResponse>('/api/payments/wallet/transactions?limit=20'),
    enabled: isLoaded && !!user,
    staleTime: 30_000,
  });

  const isLoading = walletQuery.isLoading || contractsQuery.isLoading || txQuery.isLoading;
  const hasError = walletQuery.isError || contractsQuery.isError || txQuery.isError;

  const contracts = contractsQuery.data ?? [];
  const wallet = walletQuery.data;
  const transactions = txQuery.data?.transactions ?? [];

  const escrowBreakdown = contracts.map((contract) => ({
    contractId: contract.id,
    contractTitle: contract.title,
    amount: Number(contract.totalAmount ?? contract.rate ?? 0),
    status: contract.status,
  }));
  const totalEscrow = escrowBreakdown.reduce((sum, e) => sum + e.amount, 0);

  function deriveTransactionType(tx: WalletTransaction): TransactionType {
    const d = tx.description.toLowerCase();
    if (tx.type === 'debit') return 'payout';
    if (d.includes('marketplace') || d.includes('product')) return 'marketplace';
    if (d.includes('bounty') || d.includes('task')) return 'bounty';
    if (d.includes('escrow')) return 'escrow_deposit';
    return 'contract';
  }

  function statusBadgeVariant(status: string): 'cyan' | 'green' | 'amber' | 'gray' {
    const s = status.toLowerCase();
    if (s === 'active') return 'green';
    if (s === 'completed') return 'cyan';
    if (s === 'disputed') return 'amber';
    return 'gray';
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center space-y-3 max-w-sm px-6">
          <p className="text-text-primary font-medium">Failed to load billing data</p>
          <p className="text-text-muted text-sm">Please try again.</p>
          <Button
            size="sm"
            onClick={() => {
              void walletQuery.refetch();
              void contractsQuery.refetch();
              void txQuery.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary mb-1">Billing & Payments</h1>
          <p className="text-text-secondary text-sm">Manage your subscription and escrow funds</p>
        </div>

        {/* Billing Overview */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-xl text-text-primary">Billing Overview</h2>
              <p className="text-text-muted text-sm">Live data from wallet and contracts</p>
            </div>
            <Link href="/company/post-task">
              <Button size="sm" variant="secondary">Fund New Task</Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Wallet Balance</p>
              <p className="font-mono text-lg text-text-primary">{formatCurrency(wallet?.balance ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Earned</p>
              <p className="font-mono text-lg text-accent-green">{formatCurrency(wallet?.totalEarned ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Withdrawn</p>
              <p className="font-mono text-lg text-text-primary">{formatCurrency(wallet?.totalWithdrawn ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Monthly Withdrawal</p>
              <p className="font-mono text-lg text-accent-cyan">{formatCurrency(wallet?.monthlyWithdrawal ?? 0)}</p>
            </div>
          </div>
        </div>

        {/* Escrow Balance */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-semibold text-text-primary text-lg mb-1">Escrow Balance</h2>
              <p className="text-text-muted text-sm">Funds held for active contracts</p>
            </div>
            <Link href="/company/tasks">
              <Button size="md" data-testid="add-funds-btn">Manage Tasks</Button>
            </Link>
          </div>

          <div className="mb-6">
            <p className="text-sm text-text-muted mb-2">Total in Escrow</p>
            <p className="font-display text-4xl font-bold text-accent-cyan">
              <span className="font-mono">{formatCurrency(totalEscrow)}</span>
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-text-muted uppercase tracking-wider">Per-Contract Breakdown</p>
            {escrowBreakdown.length === 0 ? (
              <p className="text-sm text-text-muted">No active contracts in escrow yet.</p>
            ) : (
              escrowBreakdown.map((escrow) => (
                <div
                  key={escrow.contractId}
                  className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl border border-[rgba(255,255,255,0.04)]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{escrow.contractTitle}</p>
                    <p className="text-xs text-text-muted">Contract #{escrow.contractId}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-mono font-semibold text-accent-cyan">{formatCurrency(escrow.amount)}</p>
                    <Badge variant={statusBadgeVariant(escrow.status)} className="text-[9px] mt-1 capitalize">
                      {escrow.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="font-display font-semibold text-text-primary text-lg mb-4">Transaction History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">Description</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-text-muted uppercase">Type</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-text-muted uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-text-muted text-sm">
                      No transactions yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => {
                    const txType = deriveTransactionType(txn);
                    return (
                      <tr key={txn.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="py-3 px-4 text-text-secondary">
                          {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-3 px-4 text-text-primary">{txn.description}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={getTransactionTypeBadgeVariant(txType)} className="text-[10px]">
                            {txType.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-mono font-semibold text-text-primary">
                            {txn.type === 'debit' ? '-' : '+'}{formatCurrency(Math.abs(txn.amount))}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
