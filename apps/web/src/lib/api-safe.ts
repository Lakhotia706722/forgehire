/**
 * Helpers to normalize API responses and avoid runtime crashes on missing fields.
 */

/** Coerce unknown API payloads into an array (handles raw arrays and wrapped lists). */
export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['data', 'items', 'products', 'tasks', 'engineers', 'bounties']) {
      const nested = record[key];
      if (Array.isArray(nested)) return nested as T[];
    }
  }
  return [];
}

export const EMPTY_PLATFORM_STATS = {
  totalEngineers: 0,
  verifiedEngineers: 0,
  activeEngineers: 0,
  totalCompanies: 0,
  activeContracts: 0,
  completedContracts: 0,
  totalBounties: 0,
  activeBounties: 0,
  totalPaidOut: 0,
} as const;
