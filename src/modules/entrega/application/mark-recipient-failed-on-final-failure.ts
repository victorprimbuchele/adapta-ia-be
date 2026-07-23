import { UnrecoverableError } from "bullmq";

import type { DeliveryRepository } from "../ports/delivery-repository.js";
import { DELIVERY_JOB_ATTEMPTS } from "./delivery-job-options.js";
import { teacherVisibleDeliveryErrorMessage } from "./teacher-visible-delivery-error.js";
import type { DeliveryRecipientJob } from "../ports/delivery-queue.js";

type FailedDeliveryJob = {
  data: DeliveryRecipientJob;
  attemptsMade: number;
  opts: { attempts?: number };
};

/** Falha definitiva: sem retry (`UnrecoverableError`) ou tentativas esgotadas. */
export function isFinalDeliveryJobFailure(job: FailedDeliveryJob, error: Error): boolean {
  if (error instanceof UnrecoverableError) {
    return true;
  }

  const maxAttempts = job.opts.attempts ?? DELIVERY_JOB_ATTEMPTS;
  return job.attemptsMade >= maxAttempts;
}

/**
 * Marca o `EmailSending` como `falhou` na falha definitiva do job individual
 * (Épico 7, BE-E7.8). Erros permanentes (ex.: e-mail inválido) não retentam;
 * falhas transitórias (SMTP) permanecem `pendente` até esgotar backoff.
 * Cada job é independente — a falha de um destinatário não trava o lote.
 */
export async function markRecipientFailedOnFinalFailure(
  job: FailedDeliveryJob | undefined,
  error: Error,
  deliveryRepository: DeliveryRepository,
): Promise<void> {
  if (!job || !isFinalDeliveryJobFailure(job, error)) {
    return;
  }

  try {
    await deliveryRepository.updateRecipientStatus(job.data.recipientId, {
      status: "falhou",
      failedReason: teacherVisibleDeliveryErrorMessage(error.cause ?? error),
    });
  } catch (updateError) {
    console.error(`[worker] failed to mark recipient as failed:`, updateError);
  }
}
