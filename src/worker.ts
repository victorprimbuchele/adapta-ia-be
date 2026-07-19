import { Worker } from "bullmq";

import type { HomeworkAdaptationJob } from "./modules/material/ports/adaptation-queue.js";
import { HOMEWORK_ADAPTATION_QUEUE } from "./modules/material/ports/adaptation-queue.js";
import { getRedisConnectionOptions } from "./shared/infra/redis.js";

/**
 * Worker BullMQ (ADR 006). Consome jobs de adaptação enfileirados por
 * `POST /homeworks/:id/adaptar` (BE-E5.1). O processamento via LLM será
 * implementado nos tickets seguintes do Épico 5; por enquanto apenas
 * registra o job para não bloquear o endpoint.
 */
const connection = getRedisConnectionOptions();

const worker = new Worker<HomeworkAdaptationJob>(
  HOMEWORK_ADAPTATION_QUEUE,
  async (job) => {
    console.log(
      `[worker] adaptation job ${job.id}: homework=${job.data.homeworkId} ` +
        `profile=${job.data.learningProfileId}`,
    );
  },
  { connection },
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

async function shutdown(signal: string): Promise<void> {
  console.log(`[worker] received ${signal}, shutting down…`);
  await worker.close();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
