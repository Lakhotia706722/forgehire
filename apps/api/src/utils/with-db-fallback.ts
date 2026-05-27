/**
 * Runs a DB query and returns a fallback when the schema is missing or the query fails.
 * Prevents 500s on public pages during local setup before `prisma db push`.
 */
export async function withDbFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  label?: string,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[db-fallback]${label ? ` ${label}` : ""}: ${message.split("\n")[0]}`,
    );
    return fallback;
  }
}
