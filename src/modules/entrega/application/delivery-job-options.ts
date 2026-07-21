/**
 * Política de retry/backoff dos jobs de envio (Épico 6, BE-E6.2 — espelha
 * ADATATION_JOB_OPTIONS do módulo material).
 */
export const DELIVERY_JOB_ATTEMPTS = 3;

export const DELIVERY_JOB_BACKOFF = {
  type: "exponential" as const,
  delay: 2_000,
};

export const DELIVERY_JOB_OPTIONS = {
  attempts: DELIVERY_JOB_ATTEMPTS,
  backoff: DELIVERY_JOB_BACKOFF,
  removeOnComplete: 100,
  removeOnFail: 100,
};
