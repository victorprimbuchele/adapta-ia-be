/**
 * Porta de idempotência (ADR 005). Trocar Redis por outro store = trocar
 * o adapter; use cases só pedem acquire/release.
 */
export interface IdempotencyPort {
  /**
   * Tenta adquirir a chave (`SET NX` + TTL). Retorna `true` na primeira
   * aquisição e `false` se a chave já existir.
   */
  acquire(key: string, ttlSeconds: number): Promise<boolean>;

  /** Libera a chave (ex.: falha definitiva do processamento). */
  release(key: string): Promise<void>;
}
