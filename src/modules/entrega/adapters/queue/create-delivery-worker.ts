import { Worker } from "bullmq";

import { prisma } from "../../../../shared/infra/prisma-client.js";
import { getRedisConnectionOptions } from "../../../../shared/infra/redis.js";
import { GetFile } from "../../../material/application/get-file.js";
import { PrismaFileRepository } from "../../../material/adapters/persistence/prisma-file-repository.js";
import { PrismaHomeworkRepository } from "../../../material/adapters/persistence/prisma-homework-repository.js";
import { LocalObjectStorage } from "../../../material/adapters/storage/local-object-storage.js";
import { DELIVERY_JOB_ATTEMPTS } from "../../application/delivery-job-options.js";
import { markRecipientFailedOnFinalFailure } from "../../application/mark-recipient-failed-on-final-failure.js";
import { ProcessDeliveryRecipient } from "../../application/process-delivery-recipient.js";
import { toDeliveryJobError } from "../../application/to-delivery-job-error.js";
import type { DeliveryRecipientJob } from "../../ports/delivery-queue.js";
import { HOMEWORK_DELIVERY_QUEUE } from "../../ports/delivery-queue.js";
import { NodemailerEmailSender } from "../email/nodemailer-email-sender.js";
import { PrismaDeliveryRepository } from "../persistence/prisma-delivery-repository.js";

/**
 * Cria o worker BullMQ que consome `homework-delivery` (Épico 6, BE-E6.2
 * — espelha `createHomeworkAdaptationWorker`). Falhas retriáveis (SMTP)
 * usam backoff; permanentes viram `UnrecoverableError`. Em falha
 * definitiva, o destinatário é marcado `falhou` com motivo visível ao
 * professor.
 */
export function createDeliveryWorker(
  processDeliveryRecipient: ProcessDeliveryRecipient = createDefaultProcessor(),
  deliveryRepository = new PrismaDeliveryRepository(prisma),
): Worker<DeliveryRecipientJob> {
  const worker = new Worker<DeliveryRecipientJob>(
    HOMEWORK_DELIVERY_QUEUE,
    async (job) => {
      try {
        await processDeliveryRecipient.execute(job.data);
      } catch (error) {
        console.error(
          `[worker] delivery job ${job.id} error ` +
            `(attempt ${job.attemptsMade + 1}/${job.opts.attempts ?? DELIVERY_JOB_ATTEMPTS}):`,
          error,
        );
        throw toDeliveryJobError(error);
      }
    },
    { connection: getRedisConnectionOptions() },
  );

  worker.on("ready", () => {
    console.log(`adapta-ia-be worker listening on queue "${HOMEWORK_DELIVERY_QUEUE}"`);
  });

  worker.on("failed", (job, error) => {
    const attempts = job?.opts.attempts ?? DELIVERY_JOB_ATTEMPTS;
    const attemptsMade = job?.attemptsMade ?? 0;
    const isFinal = !job || attemptsMade >= attempts;

    console.error(
      `[worker] delivery job ${job?.id ?? "unknown"} failed` +
        (isFinal ? " permanently" : ` (will retry ${attemptsMade}/${attempts})`) +
        ":",
      error.message,
    );

    void markRecipientFailedOnFinalFailure(job, error, deliveryRepository);
  });

  worker.on("completed", (job) => {
    console.log(`[worker] delivery job ${job.id} completed`);
  });

  return worker;
}

function createDefaultProcessor(): ProcessDeliveryRecipient {
  return new ProcessDeliveryRecipient(
    new PrismaDeliveryRepository(prisma),
    new PrismaHomeworkRepository(prisma),
    new NodemailerEmailSender(),
    new GetFile(new PrismaFileRepository(prisma), new LocalObjectStorage()),
  );
}
