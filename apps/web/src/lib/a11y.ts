/** ARIA boolean attributes must be the strings "true" or "false" for static analyzers. */
export function ariaBool(value: boolean): 'true' | 'false' {
  return value ? 'true' : 'false';
}

/** Rounded value for ARIA progress/slider attributes (satisfies React number types). */
export function ariaNum(value: number): number {
  return Math.round(value);
}

const AVATAR_BG_CLASSES = [
  'avatar-bg-0',
  'avatar-bg-1',
  'avatar-bg-2',
  'avatar-bg-3',
  'avatar-bg-4',
  'avatar-bg-5',
] as const;

/** Deterministic avatar background class (no inline styles). */
export function avatarBgClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_BG_CLASSES[Math.abs(hash) % AVATAR_BG_CLASSES.length];
}
