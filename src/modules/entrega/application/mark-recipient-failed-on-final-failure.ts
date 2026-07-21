import type { DeliveryRepository } from "../ports/delivery-repository.js";
import { DELIVERY_JOB_ATTEMPTS } from "./delivery-job-options.js";
import { teacherVisibleDeliveryErrorMessage } from "./teacher-visible-delivery-error.js";
import type { DeliveryRecipientJob } from "../ports/delivery-queue.js";

/**
 * Marca o destinatário como `falhou` apenas na falha persistente (última
 * tentativa esgotada) — BE-E6.2, espelha
 * `releaseAdaptationIdempotencyOnFinalFailure`. Durante retries com
 * backoff o destinatário permanece `pendente`.
 */
export async function markRecipientFailedOnFinalFailure(
  job:
    | {
        data: DeliveryRecipientJob;
        attemptsMade: number;
        opts: { attempts?: number };
      }
    | undefined,
  error: Error,
  deliveryRepository: DeliveryRepository,
): Promise<void> {
  if (!job) {
    return;
  }

  const maxAttempts = job.opts.attempts ?? DELIVERY_JOB_ATTEMPTS;
  if (job.attemptsMade < maxAttempts) {
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
