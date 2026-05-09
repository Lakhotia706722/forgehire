'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  useWallet,
  useWalletTransactions,
  useEarningsChart,
  useWithdraw,
  type WalletTransaction,
} from '@/lib/api-hooks';
import {
  getTransactionTypeBadgeVariant,
  formatCurrency,
} from '@/lib/payments-analytics-data';

type ChartPeriod = 'year' | '6months' | '30days';

export default function EngineerWalletPage() {
  const [showWithdrawModal, setShowWithdrawModal] = React.useState(false);
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [chartPeriod, setChartPeriod] = React.useState<ChartPeriod>('6months');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState<string>('all');

  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: txData, isLoading: txLoading } = useWalletTransactions(undefined, 20);
  const { data: earningsData, isLoading: earningsLoading } = useEarningsChart(
    chartPeriod === '30days' ? '30days' : chartPeriod === 'year' ? 'year' : '6months'
  );

  const transactions = txData?.transactions ?? [];

  // Filter transactions
  const filteredTransactions = transactions.filter((txn) => {
    if (filterType !== 'all' && txn.type !== filterType) return false;
    if (searchQuery && !txn.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const balance = {
    available: wallet?.balance ?? 0,
    pending: wallet?.pendingRelease ?? 0,
    thisMonthEarnings: wallet?.thisMonthEarnings ?? 0,
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Hero Balance Card */}
        <div className="relative bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 overflow-hidden">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,1) 39px, rgba(255,255,255,1) 40px),
                repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,1) 39px, rgba(255,255,255,1) 40px)
              `,
            }}
            aria-hidden="true"
          />

          <div className="relative z-10">
            <p className="text-sm text-text-muted mb-2">Available Balance</p>
            <h1 className="font-display text-5xl font-bold text-text-primary mb-6">
              {walletLoading ? (
                <Skeleton className="h-12 w-48 inline-block" />
              ) : (
                <span className="font-mono">{formatCurrency(balance.available)}</span>
              )}
            </h1>

            <div className="flex flex-wrap gap-3 mb-6">
              <Button size="lg" onClick={() => setShowWithdrawModal(true)} data-testid="withdraw-btn">
                Withdraw
              </Button>
              <Button variant="ghost" size="lg" onClick={() => setShowHistoryModal(true)}>
                Transaction History
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-text-muted mb-1">Pending Release</p>
                <p className="font-mono font-semibold text-accent-amber">{formatCurrency(balance.pending)}</p>
              </div>
              <div>
                <p className="text-text-muted mb-1">This Month Earnings</p>
                <p className="font-mono font-semibold text-accent-green">{formatCurrency(balance.thisMonthEarnings)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Chart */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-text-primary text-lg">Monthly Earnings</h2>
            <div className="flex gap-2" role="group" aria-label="Chart period">
              {(['year', '6months', '30days'] as ChartPeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg transition-all',
                    chartPeriod === period
                      ? 'bg-accent-cyan text-bg-base font-semibold'
                      : 'text-text-muted hover:text-text-secondary'
                  )}
                  aria-pressed={chartPeriod === period}
                >
                  {period === 'year' ? 'This Year' : period === '6months' ? 'Last 6 Months' : 'Last 30 Days'}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={earningsData ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#8892A4" style={{ fontSize: 12 }} />
              <YAxis stroke="#8892A4" style={{ fontSize: 12 }} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141828',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [`₹${Number(value || 0).toLocaleString('en-IN')}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'DM Sans' }} />
              <Area type="monotone" dataKey="contracts" stackId="1" stroke="#00D4FF" fill="rgba(0,212,255,0.15)" name="Contracts" />
              <Area type="monotone" dataKey="bounties" stackId="1" stroke="#F59E0B" fill="rgba(245,158,11,0.15)" name="Bounties" />
              <Area type="monotone" dataKey="marketplace" stackId="1" stroke="#7B5EA7" fill="rgba(123,94,167,0.15)" name="Marketplace" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Transaction History Preview */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-text-primary text-lg">Recent Transactions</h2>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="text-sm text-accent-cyan hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {txLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl border border-[rgba(255,255,255,0.04)]">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-muted text-sm">No transactions yet</p>
              </div>
            ) : (
              transactions.slice(0, 5).map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl border border-[rgba(255,255,255,0.04)]"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Badge variant={getTransactionTypeBadgeVariant(txn.type as any)} className="shrink-0">
                    {txn.type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{txn.description}</p>
                    <p className="text-xs text-text-muted">{new Date(txn.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className={cn('font-mono font-semibold text-sm', txn.amount >= 0 ? 'text-accent-green' : 'text-accent-red')}>
                    {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)}
                  </p>
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      <WithdrawModal
        open={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        availableBalance={balance.available}
      />

      {/* Transaction History Modal */}
      <TransactionHistoryModal
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        transactions={filteredTransactions}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
      />
    </div>
  );
}

// ─── Withdraw Modal ───────────────────────────────────────────
interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  availableBalance: number;
}

function WithdrawModal({ open, onClose, availableBalance }: WithdrawModalProps) {
  const [amount, setAmount] = React.useState('');
  const [method, setMethod] = React.useState<'upi' | 'neft'>('upi');
  const [upiId, setUpiId] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const withdraw = useWithdraw();

  const amountNum = parseFloat(amount) || 0;
  const showKycBanner = amountNum > 50000;
  const conversionRate = 83;
  const amountUSD = (amountNum / conversionRate).toFixed(2);

  async function handleWithdraw() {
    if (amountNum <= 0 || amountNum > availableBalance) return;
    try {
      await withdraw.mutateAsync({ amount: amountNum, method, upiId });
      setSuccess(true);
    } catch (e: any) {
      // toast handled by mutation
    }
  }

  function handleClose() {
    setSuccess(false);
    setAmount('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={success ? undefined : 'Withdraw Funds'} size="md">
      {success ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] flex items-center justify-center animate-fade-up">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2v20M2 12l10-10 10 10"/>
            </svg>
          </div>
          <h3 className="font-display font-bold text-xl text-text-primary">Withdrawal Initiated!</h3>
          <p className="text-text-secondary text-sm">
            You will receive <span className="font-mono text-accent-green">{formatCurrency(amountNum)}</span> in your account within{' '}
            <strong>{method === 'upi' ? '2 hours' : '24 hours'}</strong>.
          </p>
          <Button size="md" onClick={handleClose}>Got it</Button>
        </div>
      ) : (
        <div className="p-6 space-y-5">
          {showKycBanner && (
            <div className="p-4 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#EF4444" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <div className="flex-1">
                <p className="text-xs text-accent-red font-semibold">KYC Required</p>
                <p className="text-xs text-text-secondary mt-0.5">Complete KYC to withdraw amounts over ₹50,000</p>
              </div>
              <Button size="sm" variant="danger">Complete KYC</Button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono pointer-events-none">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={availableBalance}
                placeholder="0"
                className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl pl-10 pr-4 py-3 font-mono text-xl text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
                data-testid="withdraw-amount-input"
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-text-muted">≈ ${amountUSD} USD</span>
              <button
                onClick={() => setAmount(String(availableBalance))}
                className="text-accent-cyan hover:underline"
              >
                Max: {formatCurrency(availableBalance)}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Withdrawal Method</label>
            <div className="flex gap-3">
              {(['upi', 'neft'] as ('upi' | 'neft')[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={cn(
                    'flex-1 p-4 rounded-xl border-2 transition-all text-left',
                    method === m
                      ? 'border-[rgba(0,212,255,0.5)] bg-[rgba(0,212,255,0.06)]'
                      : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'
                  )}
                >
                  <p className="text-sm font-semibold text-text-primary uppercase">{m}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {m === 'upi' ? 'Instant, ≤2 hours' : '24 hours'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {method === 'upi' ? 'UPI ID' : 'Bank Account'}
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
            />
          </div>

          <div className="p-3 bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.2)] rounded-xl text-xs text-accent-cyan">
            You will receive <strong>{formatCurrency(amountNum)}</strong> in your account within{' '}
            <strong>{method === 'upi' ? '2 hours' : '24 hours'}</strong>.
          </div>

          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              loading={withdraw.isPending}
              disabled={amountNum <= 0 || amountNum > availableBalance || showKycBanner}
              onClick={handleWithdraw}
              data-testid="confirm-withdraw-btn"
            >
              Withdraw {formatCurrency(amountNum)}
            </Button>
            <Button variant="ghost" size="lg" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Transaction History Modal ────────────────────────────────
interface TransactionHistoryModalProps {
  open: boolean;
  onClose: () => void;
  transactions: WalletTransaction[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterType: string;
  setFilterType: (t: string) => void;
}

function TransactionHistoryModal({
  open,
  onClose,
  transactions,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
}: TransactionHistoryModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Transaction History" size="xl">
      <div className="p-6 space-y-4">
        {/* Search & Filter */}
        <div className="flex gap-3">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions..."
            className="flex-1 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] [color-scheme:dark]"
          >
            <option value="all">All Types</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">Type</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">Description</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-muted uppercase">Amount</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-muted uppercase">Balance After</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="py-3 px-4 text-text-secondary">
                    {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={getTransactionTypeBadgeVariant(txn.type as any)} className="text-[10px]">
                      {txn.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-text-primary">{txn.description}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={cn('font-mono font-semibold', txn.type === 'credit' ? 'text-accent-green' : 'text-accent-red')}>
                      {txn.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-mono text-text-muted text-xs">
                      {formatCurrency(txn.balanceAfter)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-muted text-sm">No transactions found.</p>
          </div>
        )}

        {transactions.length > 0 && (
          <div className="flex justify-center pt-4">
            <Button variant="ghost" size="sm">Load More</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
