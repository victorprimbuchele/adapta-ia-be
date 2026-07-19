/**
 * Opções de conexão Redis para BullMQ (ADR 006) e idempotência (ADR 005 /
 * BE-E5.8). `maxRetriesPerRequest: null` é exigido pelo BullMQ.
 */
export function getRedisConnectionOptions(): {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest: null;
} {
  const url = process.env["REDIS_URL"];

  if (!url) {
    throw new Error("REDIS_URL is required.");
  }

  const parsed = new URL(url);

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
    maxRetriesPerRequest: null,
  };
}
