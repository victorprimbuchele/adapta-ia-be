import { Redis } from "ioredis";

import type { IdempotencyPort } from "../ports/idempotency.js";
import { getRedisConnectionOptions } from "../infra/redis.js";

/**
 * Adapter Redis de `IdempotencyPort` (ADR 005 / BE-E5.8).
 * Usa `SET key value EX ttl NX` para garantir uma aquisição por chave.
 */
export class RedisIdempotency implements IdempotencyPort {
  constructor(private readonly redis: Redis = createIdempotencyRedisClient()) {}

  async acquire(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redis.set(key, "1", "EX", ttlSeconds, "NX");
    return result === "OK";
  }

  async release(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

export function createIdempotencyRedisClient(): Redis {
  const options = getRedisConnectionOptions();

  return new Redis({
    host: options.host,
    port: options.port,
    ...(options.password ? { password: options.password } : {}),
    maxRetriesPerRequest: null,
  });
}
