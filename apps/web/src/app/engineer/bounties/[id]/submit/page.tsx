'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-fetch';
import { mapApiTaskToBountyDetail } from '@/lib/map-task-to-bounty';
import { useSubmitTask } from '@/lib/api-hooks';
import { toast } from 'sonner';

interface Metric { id: string; key: string; value: string }
interface Screenshot { id: string; url: string; name: string }

export default function SubmitPage({ params }: { params: { id: string } }) {
  const { data: taskRaw, isLoading, isError } = useQuery({
    queryKey: ['task', params.id],
    queryFn: () => apiFetch<Record<string, unknown>>(`/api/tasks/${params.id}`),
    enabled: !!params.id,
  });
  const bounty = taskRaw ? mapApiTaskToBountyDetail(taskRaw) : null;
  const submitTask = useSubmitTask(params.id);
  const [description, setDescription] = React.useState('');
  const [demoUrl, setDemoUrl] = React.useState('');
  const [githubUrl, setGithubUrl] = React.useState('');
  const [videoUrl, setVideoUrl] = React.useState('');
  const [screenshots, setScreenshots] = React.useState<Screenshot[]>([]);
  const [metrics, setMetrics] = React.useState<Metric[]>([{ id: '1', key: '', value: '' }]);
  const [archDiagram, setArchDiagram] = React.useState('');
  const [preview, setPreview] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const [githubStats, setGithubStats] = React.useState<{ stars: number; lastCommit: string } | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // Auto-fetch GitHub stats (simulated)
  React.useEffect(() => {
    if (!githubUrl.includes('github.com')) { setGithubStats(null); return; }
    const t = setTimeout(() => {
      setGithubStats({ stars: 142, lastCommit: '2 days ago' });
    }, 800);
    return () => clearTimeout(t);
  }, [githubUrl]);

  // Video thumbnail
  function getVideoThumbnail(url: string): string | null {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
    return null;
  }

  function handleFiles(files: FileList) {
    const newScreenshots: Screenshot[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(f),
        name: f.name,
      }));
    setScreenshots((prev) => [...prev, ...newScreenshots]);
  }

  function removeScreenshot(id: string) {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  }

  function addMetric() {
    setMetrics((prev) => [...prev, { id: crypto.randomUUID(), key: '', value: '' }]);
  }

  function updateMetric(id: string, field: 'key' | 'value', val: string) {
    setMetrics((prev) => prev.map((m) => m.id === id ? { ...m, [field]: val } : m));
  }

  function removeMetric(id: string) {
    setMetrics((prev) => prev.filter((m) => m.id !== id));
  }

  const CONFIRM_CHECKLIST = [
    'My solution addresses all required deliverables',
    'Demo URL is live and accessible',
    'Code is clean and documented',
    'Performance metrics are accurate',
    'I understand this submission is final',
  ];
  const [confirmChecked, setConfirmChecked] = React.useState<Record<string, boolean>>({});
  const allConfirmed = CONFIRM_CHECKLIST.every((_, i) => confirmChecked[i]);

  async function handleConfirmSubmit() {
    const plainDescription = description.replace(/<[^>]+>/g, ' ').trim();
    if (plainDescription.length < 50) {
      toast.error('Description must be at least 50 characters');
      return;
    }

    const metricsRecord = metrics.reduce<Record<string, string>>((acc, m) => {
      if (m.key.trim()) acc[m.key.trim()] = m.value;
      return acc;
    }, {});

    try {
      await submitTask.mutateAsync({
        description: plainDescription,
        demoUrl: demoUrl || null,
        githubUrl: githubUrl || null,
        videoUrl: videoUrl || null,
        performanceMetrics: Object.keys(metricsRecord).length ? metricsRecord : null,
        architectureDiagram: archDiagram || null,
      });
      setShowConfirm(false);
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit solution');
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base p-8 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !bounty) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-primary font-semibold mb-2">Bounty not found</p>
          <Link href="/engineer/bounties" className="text-accent-cyan text-sm hover:underline">
            Back to bounties
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Solution Submitted!</h1>
          <p className="text-text-secondary text-sm">The company will review your submission and respond within 72 hours.</p>
          <Link href={`/engineer/bounties/${params.id}`}>
            <Button variant="secondary" size="md">Back to Bounty</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/engineer/bounties/${params.id}`} className="text-xs text-text-muted hover:text-text-secondary transition-colors mb-3 block">
            ← Back to bounty
          </Link>
          <h1 className="font-display text-2xl font-bold text-text-primary">Submit Solution</h1>
          <p className="text-text-secondary text-sm mt-1 line-clamp-1">{bounty.title}</p>
        </div>

        {/* Preview toggle */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setPreview(false)}
            className={cn('text-sm px-3 py-1.5 rounded-lg transition-all', !preview ? 'bg-accent-cyan text-bg-base font-semibold' : 'text-text-muted hover:text-text-secondary')}
          >
            Edit
          </button>
          <button
            onClick={() => setPreview(true)}
            className={cn('text-sm px-3 py-1.5 rounded-lg transition-all', preview ? 'bg-accent-cyan text-bg-base font-semibold' : 'text-text-muted hover:text-text-secondary')}
          >
            Preview
          </button>
        </div>

        {preview ? (
          <SubmissionPreview
            description={description}
            demoUrl={demoUrl}
            githubUrl={githubUrl}
            videoUrl={videoUrl}
            screenshots={screenshots}
            metrics={metrics}
            archDiagram={archDiagram}
            githubStats={githubStats}
            getVideoThumbnail={getVideoThumbnail}
          />
        ) : (
          <div className="space-y-8">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Solution Description <span className="text-accent-red">*</span>
              </label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Describe your solution, approach, and key decisions..."
                minHeight={200}
              />
            </div>

            {/* Demo URL */}
            <div>
              <Input
                label="Demo URL"
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder=" "
                hint="Live demo or hosted version of your solution"
              />
              {demoUrl && (
                <div className="mt-2 p-3 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl">
                  <p className="text-xs text-text-muted mb-1">Link preview</p>
                  <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-cyan hover:underline break-all">
                    {demoUrl}
                  </a>
                </div>
              )}
            </div>

            {/* GitHub URL */}
            <div>
              <Input
                label="GitHub Repository URL"
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder=" "
              />
              {githubStats && (
                <div className="mt-2 flex items-center gap-4 px-3 py-2 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-text-muted">
                  <span>⭐ {githubStats.stars} stars</span>
                  <span>Last commit: {githubStats.lastCommit}</span>
                </div>
              )}
            </div>

            {/* Screenshots */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Screenshots</label>
              <div
                className={cn(
                  'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
                  dragOver
                    ? 'border-accent-cyan bg-[rgba(0,212,255,0.04)]'
                    : 'border-[rgba(255,255,255,0.1)] hover:border-[rgba(0,212,255,0.3)]'
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload screenshots"
                onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              >
                <p className="text-sm text-text-secondary">Drag & drop or <span className="text-accent-cyan">browse</span></p>
                <p className="text-xs text-text-muted mt-1">PNG, JPG, WebP · Multiple files accepted</p>
              </div>
              <input
                ref={fileRef}
                id="screenshot-upload-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                aria-label="Upload screenshot files"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />

              {screenshots.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {screenshots.map((s) => (
                    <div key={s.id} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.url} alt={s.name} className="w-20 h-20 object-cover rounded-lg border border-[rgba(255,255,255,0.08)]" />
                      <button
                        onClick={() => removeScreenshot(s.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent-red text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove ${s.name}`}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video URL */}
            <div>
              <Input
                label="Video Demo URL (YouTube / Loom)"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder=" "
              />
              {videoUrl && getVideoThumbnail(videoUrl) && (
                <div className="mt-2 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)] w-48">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getVideoThumbnail(videoUrl)!} alt="Video thumbnail" className="w-full" />
                </div>
              )}
            </div>

            {/* Performance metrics */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Performance Metrics</label>
              <div className="space-y-2">
                {metrics.map((m) => (
                  <div key={m.id} className="flex gap-2 items-center">
                    <input
                      value={m.key}
                      onChange={(e) => updateMetric(m.id, 'key', e.target.value)}
                      placeholder="Metric name (e.g. Accuracy)"
                      className="flex-1 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
                    />
                    <input
                      value={m.value}
                      onChange={(e) => updateMetric(m.id, 'value', e.target.value)}
                      placeholder="Value (e.g. 94.2%)"
                      className="flex-1 bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
                    />
                    <button onClick={() => removeMetric(m.id)} className="text-text-muted hover:text-accent-red transition-colors" aria-label="Remove metric">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13"/></svg>
                    </button>
                  </div>
                ))}
                <button onClick={addMetric} className="text-xs text-accent-cyan hover:underline">+ Add metric</button>
              </div>
            </div>

            {/* Architecture diagram */}
            <div>
              <Input
                label="Architecture Diagram URL"
                type="url"
                value={archDiagram}
                onChange={(e) => setArchDiagram(e.target.value)}
                placeholder=" "
                hint="Link to Excalidraw, Miro, Lucidchart, or uploaded image"
              />
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <Button
                size="lg"
                className="w-full"
                onClick={() => setShowConfirm(true)}
                disabled={!description.trim()}
              >
                Submit Solution
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Submission" size="md">
        <div className="p-6 space-y-4">
          <p className="text-sm text-text-secondary">Please confirm the following before submitting:</p>
          <div className="space-y-3">
            {CONFIRM_CHECKLIST.map((item, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!confirmChecked[i]}
                  onChange={() => setConfirmChecked((prev) => ({ ...prev, [i]: !prev[i] }))}
                  className="mt-0.5 w-5 h-5 shrink-0 rounded border-[rgba(255,255,255,0.2)] bg-bg-elevated accent-accent-cyan"
                />
                <span className="text-sm text-text-secondary">{item}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              size="md"
              className="flex-1"
              disabled={!allConfirmed || submitTask.isPending}
              onClick={handleConfirmSubmit}
            >
              {submitTask.isPending ? 'Submitting…' : 'Confirm & Submit'}
            </Button>
            <Button variant="ghost" size="md" onClick={() => setShowConfirm(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SubmissionPreview({ description, demoUrl, githubUrl, videoUrl, screenshots, metrics, archDiagram, githubStats, getVideoThumbnail }: any) {
  return (
    <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-6">
      <p className="text-xs text-text-muted uppercase tracking-wider">Preview — how the company sees your submission</p>
      {description && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-2">Description</h3>
          <div className="text-sm text-text-secondary prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: description }} />
        </div>
      )}
      {demoUrl && <div><h3 className="text-sm font-medium text-text-secondary mb-1">Demo</h3><a href={demoUrl} className="text-sm text-accent-cyan hover:underline">{demoUrl}</a></div>}
      {githubUrl && <div><h3 className="text-sm font-medium text-text-secondary mb-1">GitHub</h3><a href={githubUrl} className="text-sm text-accent-cyan hover:underline">{githubUrl}</a>{githubStats && <span className="ml-3 text-xs text-text-muted">⭐ {githubStats.stars}</span>}</div>}
      {screenshots.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-2">Screenshots</h3>
          <div className="flex flex-wrap gap-2">
            {screenshots.map((s: any) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={s.id} src={s.url} alt={s.name} className="w-24 h-24 object-cover rounded-lg border border-[rgba(255,255,255,0.08)]" />
            ))}
          </div>
        </div>
      )}
      {metrics.filter((m: any) => m.key).length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-2">Performance Metrics</h3>
          <div className="flex flex-wrap gap-3">
            {metrics.filter((m: any) => m.key).map((m: any) => (
              <div key={m.id} className="px-3 py-1.5 bg-bg-elevated rounded-lg border border-[rgba(255,255,255,0.06)]">
                <p className="text-[10px] text-text-muted">{m.key}</p>
                <p className="text-sm font-mono text-accent-cyan">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
