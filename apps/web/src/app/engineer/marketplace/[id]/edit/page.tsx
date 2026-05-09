'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', params.id],
    queryFn: () => apiFetch<any>(`/api/products/${params.id}`),
    enabled: !!params.id,
  });

  const [form, setForm] = React.useState({
    name: '',
    tagline: '',
    description: '',
    priceINR: 0,
    demoUrl: '',
    githubUrl: '',
  });

  React.useEffect(() => {
    if (product?.data) {
      const p = product.data;
      setForm({
        name: p.name || '',
        tagline: p.tagline || '',
        description: p.description || '',
        priceINR: p.priceINR || 0,
        demoUrl: p.demoUrl || '',
        githubUrl: p.githubUrl || '',
      });
    }
  }, [product]);

  const save = useMutation({
    mutationFn: (data: typeof form) =>
      apiFetch(`/api/products/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product', params.id] });
      toast.success('Product updated successfully');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save'),
  });

  function patch(updates: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Link href="/engineer/marketplace/my-products" className="hover:text-text-secondary">My Products</Link>
            <span>/</span>
            <span className="text-text-secondary">Edit</span>
          </div>
          <div className="flex gap-2">
            <Link href={`/marketplace/${params.id}`}>
              <Button variant="ghost" size="sm">Preview →</Button>
            </Link>
            <Button size="md" loading={save.isPending} onClick={() => save.mutate(form)}>Save Changes</Button>
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-text-primary">Edit Product</h1>

        {/* Form */}
        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-text-primary text-lg">Basic Information</h2>
          <Input label="Product Name" value={form.name} onChange={(e) => patch({ name: e.target.value })} />
          <Input label="Tagline" value={form.tagline} onChange={(e) => patch({ tagline: e.target.value })} hint="One-line description shown in listings" />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={5}
              className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none transition-all"
            />
          </div>
        </div>

        <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-text-primary text-lg">Pricing &amp; Links</h2>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Price (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono pointer-events-none">₹</span>
              <input
                type="number"
                value={form.priceINR}
                onChange={(e) => patch({ priceINR: parseInt(e.target.value) || 0 })}
                className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl pl-10 pr-4 py-3 font-mono text-text-primary focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-all"
              />
            </div>
          </div>
          <Input label="Demo URL" type="url" value={form.demoUrl} onChange={(e) => patch({ demoUrl: e.target.value })} />
          <Input label="GitHub URL" type="url" value={form.githubUrl} onChange={(e) => patch({ githubUrl: e.target.value })} />
        </div>

        <div className="flex justify-end">
          <Button size="lg" loading={save.isPending} onClick={() => save.mutate(form)}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
