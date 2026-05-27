/** Deterministic avatar background class (pairs with .avatar-tone-* in globals.css). */
export function avatarToneClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `avatar-tone-${Math.abs(hash) % 6}`;
}

export function initialsFromName(name: string): string {
  const parts = (name || 'NH').trim().split(/\s+/).filter(Boolean);
  return parts.map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'NH';
}
