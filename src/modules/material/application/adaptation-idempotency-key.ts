/**
 * Chave Redis de idempotência por par geradora+perfil (Épico 5, BE-E5.8).
 */
export function adaptationIdempotencyKey(
  homeworkId: string,
  learningProfileId: string,
): string {
  return `idempotency:adaptation:${homeworkId}:${learningProfileId}`;
}

/** TTL padrão (24h). Sobrescrevível via `ADAPTATION_IDEMPOTENCY_TTL_SECONDS`. */
export function adaptationIdempotencyTtlSeconds(): number {
  const raw = process.env["ADAPTATION_IDEMPOTENCY_TTL_SECONDS"];
  if (!raw) {
    return 86_400;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 86_400;
}
