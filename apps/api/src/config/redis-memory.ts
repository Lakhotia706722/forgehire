/**
 * In-memory Redis substitute for local development (REDIS_URL=memory://).
 * Supports the subset of ioredis commands used by this API.
 */
type Entry = { value: string; expiresAt?: number };

export class MemoryRedis {
  private store = new Map<string, Entry>();

  on(_event: string, _handler: (...args: unknown[]) => void): this {
    return this;
  }

  private purgeExpired(key: string): void {
    const entry = this.store.get(key);
    if (entry?.expiresAt && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
    }
  }

  async ping(): Promise<string> {
    return "PONG";
  }

  async get(key: string): Promise<string | null> {
    this.purgeExpired(key);
    return this.store.get(key)?.value ?? null;
  }

  async set(key: string, value: string): Promise<"OK"> {
    this.store.set(key, { value });
    return "OK";
  }

  async setex(key: string, seconds: number, value: string): Promise<"OK"> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + seconds * 1000,
    });
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async incr(key: string): Promise<number> {
    this.purgeExpired(key);
    const current = Number(this.store.get(key)?.value ?? 0);
    const next = current + 1;
    const entry = this.store.get(key);
    this.store.set(key, {
      value: String(next),
      expiresAt: entry?.expiresAt,
    });
    return next;
  }

  async pexpire(key: string, ms: number): Promise<number> {
    this.purgeExpired(key);
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + ms;
    this.store.set(key, entry);
    return 1;
  }

  async pttl(key: string): Promise<number> {
    this.purgeExpired(key);
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    return Math.max(0, entry.expiresAt - Date.now());
  }

  async quit(): Promise<"OK"> {
    this.store.clear();
    return "OK";
  }
}
