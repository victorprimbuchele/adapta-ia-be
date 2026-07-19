/**
 * Política de retry/backoff dos jobs de adaptação (Épico 5, BE-E5.10 / ADR 006).
 * Falhas retriáveis (LLM/TTS transitórias) usam estas tentativas; falhas
 * permanentes viram `UnrecoverableError` e não entram no backoff.
 */
export const ADAPTATION_JOB_ATTEMPTS = 3;

export const ADAPTATION_JOB_BACKOFF = {
  type: "exponential" as const,
  delay: 2_000,
};

export const ADAPTATION_JOB_OPTIONS = {
  attempts: ADAPTATION_JOB_ATTEMPTS,
  backoff: ADAPTATION_JOB_BACKOFF,
  removeOnComplete: 100,
  removeOnFail: 100,
};
