import type { IdempotencyPort } from "../../../shared/ports/idempotency.js";
import type { HomeworkAdaptationJob } from "../ports/adaptation-queue.js";
import { adaptationIdempotencyKey } from "./adaptation-idempotency-key.js";
import { ADAPTATION_JOB_ATTEMPTS } from "./adaptation-job-options.js";

/**
 * Libera a chave Redis de idempotência apenas na falha persistente
 * (última tentativa esgotada) — BE-E5.8 / BE-E5.10.
 */
export async function releaseAdaptationIdempotencyOnFinalFailure(
  job:
    | {
        data: HomeworkAdaptationJob;
        attemptsMade: number;
        opts: { attempts?: number };
      }
    | undefined,
  idempotency: IdempotencyPort,
): Promise<void> {
  if (!job) {
    return;
  }

  const maxAttempts = job.opts.attempts ?? ADAPTATION_JOB_ATTEMPTS;
  if (job.attemptsMade < maxAttempts) {
    return;
  }

  try {
    await idempotency.release(
      adaptationIdempotencyKey(
        job.data.homeworkId,
        job.data.learningProfileId,
      ),
    );
  } catch (releaseError) {
    console.error(
      `[worker] failed to release idempotency key for job:`,
      releaseError,
    );
  }
}
