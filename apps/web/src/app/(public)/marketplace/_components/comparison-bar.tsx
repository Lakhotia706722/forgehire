'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { formatPrice, type ProductListing } from '@/lib/marketplace-data';

interface ComparisonBarProps {
  selected: ProductListing[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function ComparisonBar({ selected, onRemove, onClear }: ComparisonBarProps) {
  const [showModal, setShowModal] = React.useState(false);

  if (selected.length < 2) return null;

  return (
    <>
      {/* Sticky bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-bg-elevated border-t border-[rgba(0,212,255,0.2)] px-6 py-3 animate-fade-up"
        data-testid="comparison-bar"
        role="status"
        aria-live="polite"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-text-primary">
              Comparing {selected.length} product{selected.length > 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              {selected.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-bg-surface rounded-lg border border-[rgba(255,255,255,0.08)]">
                  <span className="text-xs text-text-secondary truncate max-w-[100px]">{p.name}</span>
                  <button
                    onClick={() => onRemove(p.id)}
                    className="text-text-muted hover:text-accent-red transition-colors"
                    aria-label={`Remove ${p.name} from comparison`}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M1 1l8 8M9 1L1 9"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClear} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
              Clear all
            </button>
            <Button size="sm" onClick={() => setShowModal(true)} data-testid="view-comparison-btn">
              View Comparison →
            </Button>
          </div>
        </div>
      </div>

      {/* Comparison modal */}
      <ComparisonModal
        open={showModal}
        onClose={() => setShowModal(false)}
        products={selected}
      />
    </>
  );
}

function ComparisonModal({ open, onClose, products }: { open: boolean; onClose: () => void; products: ProductListing[] }) {
  const ROWS = [
    { label: 'Price',           key: (p: ProductListing) => formatPrice(p.priceINR, p.pricingModel) },
    { label: 'Pricing Model',   key: (p: ProductListing) => p.pricingModel.replace('_', ' ') },
    { label: 'Rating',          key: (p: ProductListing) => `${p.rating} ★ (${p.reviewCount} reviews)` },
    { label: 'AI Model',        key: (p: ProductListing) => p.aiModel },
    { label: 'Try Before Buy',  key: (p: ProductListing) => p.hasTryBeforeBuy ? '✓' : '✗' },
    { label: 'Customization',   key: (p: ProductListing) => p.customizationAvailable ? '✓' : '✗' },
    { label: 'Support',         key: (p: ProductListing) => p.supportType },
    { label: 'Support Duration',key: (p: ProductListing) => p.supportDuration },
    { label: 'Accuracy',        key: (p: ProductListing) => p.accuracy ? `${p.accuracy}%` : '—' },
    { label: 'Avg Response',    key: (p: ProductListing) => p.avgResponseMs ? `${p.avgResponseMs}ms` : '—' },
    { label: 'Uptime',          key: (p: ProductListing) => p.uptime ? `${p.uptime}%` : '—' },
    { label: 'Engineer Score',  key: (p: ProductListing) => String(p.engineerScore) },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Product Comparison" size="xl">
      <div className="p-6 overflow-x-auto" data-testid="comparison-table">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-text-muted font-medium py-2 pr-4 w-36">Feature</th>
              {products.map((p) => (
                <th key={p.id} className="text-left py-2 px-3 min-w-[160px]">
                  <div className="font-display font-semibold text-text-primary text-sm">{p.name}</div>
                  <div className="text-[10px] text-text-muted font-normal">{p.category}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr
                key={row.label}
                className={cn(
                  'border-t border-[rgba(255,255,255,0.04)]',
                  i % 2 === 0 ? 'bg-transparent' : 'bg-[rgba(255,255,255,0.01)]'
                )}
              >
                <td className="py-2.5 pr-4 text-text-muted text-xs font-medium">{row.label}</td>
                {products.map((p) => {
                  const val = row.key(p);
                  const isCheck = val === '✓';
                  const isCross = val === '✗';
                  return (
                    <td key={p.id} className="py-2.5 px-3 font-mono text-xs">
                      <span className={cn(
                        isCheck ? 'text-accent-green' :
                        isCross ? 'text-text-muted' :
                        'text-text-primary'
                      )}>
                        {val}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
