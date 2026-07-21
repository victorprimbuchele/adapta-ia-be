import { UnrecoverableError } from "bullmq";

import { isRetriableDeliveryError } from "./is-retriable-delivery-error.js";
import { teacherVisibleDeliveryErrorMessage } from "./teacher-visible-delivery-error.js";

/**
 * Converte o erro do use case no erro correto para o BullMQ (BE-E6.2):
 * - permanente → `UnrecoverableError` (sem mais retries);
 * - retriável → `Error` com mensagem visível ao professor (backoff/attempts).
 */
export function toDeliveryJobError(error: unknown): Error {
  const message = teacherVisibleDeliveryErrorMessage(error);

  if (!isRetriableDeliveryError(error)) {
    return new UnrecoverableError(message);
  }

  const retryError = new Error(message);
  retryError.name = error instanceof Error ? error.name : "RetriableDeliveryError";
  retryError.cause = error;
  return retryError;
}
