import { UnrecoverableError } from "bullmq";

import { isRetriableAdaptationError } from "./is-retriable-adaptation-error.js";
import { teacherVisibleAdaptationErrorMessage } from "./teacher-visible-adaptation-error.js";

/**
 * Converte o erro do use case no erro correto para o BullMQ (BE-E5.10):
 * - permanente → `UnrecoverableError` (sem mais retries);
 * - retriável → `Error` com mensagem visível ao professor (backoff/attempts).
 */
export function toAdaptationJobError(error: unknown): Error {
  const message = teacherVisibleAdaptationErrorMessage(error);

  if (!isRetriableAdaptationError(error)) {
    return new UnrecoverableError(message);
  }

  const retryError = new Error(message);
  retryError.name =
    error instanceof Error ? error.name : "RetriableAdaptationError";
  retryError.cause = error;
  return retryError;
}
