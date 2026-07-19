import type { IdempotencyPort } from "../../ports/idempotency.js";

/**
 * Fake de `IdempotencyPort` em memória (ADR 009 / ADR 005).
 */
export class InMemoryIdempotency implements IdempotencyPort {
  /** chave → epoch ms de expiração */
  readonly keys: Map<string, number> = new Map();

  async acquire(key: string, ttlSeconds: number): Promise<boolean> {
    this.purgeExpired();

    if (this.keys.has(key)) {
      return false;
    }

    this.keys.set(key, Date.now() + ttlSeconds * 1000);
    return true;
  }

  async release(key: string): Promise<void> {
    this.keys.delete(key);
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, expiresAt] of this.keys) {
      if (expiresAt <= now) {
        this.keys.delete(key);
      }
    }
  }
}
