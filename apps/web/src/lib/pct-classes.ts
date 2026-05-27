/** Quantize 0–100 to nearest 5 for CSS width/left utility classes (no inline styles). */
export function quantizePct(pct: number): number {
  return Math.min(100, Math.max(0, Math.round(pct / 5) * 5));
}

export function wPctClass(pct: number): string {
  return `w-pct-${quantizePct(pct)}`;
}

export function leftPctClass(pct: number): string {
  return `left-pct-${quantizePct(pct)}`;
}

/** Active range segment between two percentages. */
export function rangeSegmentClasses(lowPct: number, highPct: number): string {
  const low = quantizePct(lowPct);
  const high = quantizePct(highPct);
  return `${leftPctClass(low)} w-pct-${Math.max(0, high - low)}`;
}
