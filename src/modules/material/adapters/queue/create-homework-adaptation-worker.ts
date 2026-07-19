import { Worker } from "bullmq";

import { RedisIdempotency } from "../../../../shared/adapters/redis-idempotency.js";
import type { IdempotencyPort } from "../../../../shared/ports/idempotency.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { getRedisConnectionOptions } from "../../../../shared/infra/redis.js";
import { PrismaLearningProfileRepository } from "../../../escola/adapters/persistence/prisma-learning-profile-repository.js";
import { ADAPTATION_JOB_ATTEMPTS } from "../../application/adaptation-job-options.js";
import { ProcessHomeworkAdaptation } from "../../application/process-homework-adaptation.js";
import { releaseAdaptationIdempotencyOnFinalFailure } from "../../application/release-adaptation-idempotency-on-final-failure.js";
import { toAdaptationJobError } from "../../application/to-adaptation-job-error.js";
import type { HomeworkAdaptationJob } from "../../ports/adaptation-queue.js";
import { HOMEWORK_ADAPTATION_QUEUE } from "../../ports/adaptation-queue.js";
import { OpenAiCompatibleTextSimplifier } from "../llm/openai-compatible-text-simplifier.js";
import { PrismaFileRepository } from "../persistence/prisma-file-repository.js";
import { PrismaHomeworkRepository } from "../persistence/prisma-homework-repository.js";
import { LocalObjectStorage } from "../storage/local-object-storage.js";
import { OpenAiCompatibleAudioGenerator } from "../tts/openai-compatible-audio-generator.js";

/**
 * Cria o worker BullMQ que consome `homework-adaptation` (BE-E5.2–E5.10).
 * Falhas retriáveis (LLM/TTS) usam backoff; permanentes viram
 * `UnrecoverableError`. Em falha definitiva, libera a chave Redis de
 * idempotência e o status de polling fica `erro`.
 */
export function createHomeworkAdaptationWorker(
  processHomeworkAdaptation: ProcessHomeworkAdaptation = createDefaultProcessor(),
  idempotency: IdempotencyPort = new RedisIdempotency(),
): Worker<HomeworkAdaptationJob> {
  const worker = new Worker<HomeworkAdaptationJob>(
    HOMEWORK_ADAPTATION_QUEUE,
    async (job) => {
      try {
        await processHomeworkAdaptation.execute(job.data);
      } catch (error) {
        console.error(
          `[worker] adaptation job ${job.id} error ` +
            `(attempt ${job.attemptsMade + 1}/${job.opts.attempts ?? ADAPTATION_JOB_ATTEMPTS}):`,
          error,
        );
        throw toAdaptationJobError(error);
      }
    },
    { connection: getRedisConnectionOptions() },
  );

  worker.on("ready", () => {
    console.log(
      `adapta-ia-be worker listening on queue "${HOMEWORK_ADAPTATION_QUEUE}"`,
    );
  });

  worker.on("failed", (job, error) => {
    const attempts = job?.opts.attempts ?? ADAPTATION_JOB_ATTEMPTS;
    const attemptsMade = job?.attemptsMade ?? 0;
    const isFinal = !job || attemptsMade >= attempts;

    console.error(
      `[worker] adaptation job ${job?.id ?? "unknown"} failed` +
        (isFinal ? " permanently" : ` (will retry ${attemptsMade}/${attempts})`) +
        ":",
      error.message,
    );

    void releaseAdaptationIdempotencyOnFinalFailure(job, idempotency);
  });

  worker.on("completed", (job) => {
    console.log(`[worker] adaptation job ${job.id} completed`);
  });

  return worker;
}

function createDefaultProcessor(): ProcessHomeworkAdaptation {
  return new ProcessHomeworkAdaptation(
    new PrismaHomeworkRepository(prisma),
    new PrismaLearningProfileRepository(prisma),
    new OpenAiCompatibleTextSimplifier(),
    new OpenAiCompatibleAudioGenerator(),
    new LocalObjectStorage(),
    new PrismaFileRepository(prisma),
  );
}
