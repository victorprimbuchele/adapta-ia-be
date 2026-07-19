import { Worker } from "bullmq";

import { getRedisConnectionOptions } from "../../../../shared/infra/redis.js";
import { ProcessHomeworkAdaptation } from "../../application/process-homework-adaptation.js";
import type { HomeworkAdaptationJob } from "../../ports/adaptation-queue.js";
import { HOMEWORK_ADAPTATION_QUEUE } from "../../ports/adaptation-queue.js";

/**
 * Cria o worker BullMQ que consome `homework-adaptation` (BE-E5.2 / ADR 006).
 * O processo HTTP só enfileira; este worker processa em background.
 */
export function createHomeworkAdaptationWorker(
  processHomeworkAdaptation: ProcessHomeworkAdaptation = new ProcessHomeworkAdaptation(),
): Worker<HomeworkAdaptationJob> {
  const worker = new Worker<HomeworkAdaptationJob>(
    HOMEWORK_ADAPTATION_QUEUE,
    async (job) => {
      await processHomeworkAdaptation.execute(job.data);
    },
    { connection: getRedisConnectionOptions() },
  );

  worker.on("ready", () => {
    console.log(
      `adapta-ia-be worker listening on queue "${HOMEWORK_ADAPTATION_QUEUE}"`,
    );
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[worker] adaptation job ${job?.id ?? "unknown"} failed:`,
      error,
    );
  });

  worker.on("completed", (job) => {
    console.log(`[worker] adaptation job ${job.id} completed`);
  });

  return worker;
}
