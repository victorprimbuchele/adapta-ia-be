import { Worker } from "bullmq";

import { RedisIdempotency } from "../../../../shared/adapters/redis-idempotency.js";
import type { IdempotencyPort } from "../../../../shared/ports/idempotency.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { getRedisConnectionOptions } from "../../../../shared/infra/redis.js";
import { PrismaLearningProfileRepository } from "../../../escola/adapters/persistence/prisma-learning-profile-repository.js";
import { adaptationIdempotencyKey } from "../../application/adaptation-idempotency-key.js";
import { ProcessHomeworkAdaptation } from "../../application/process-homework-adaptation.js";
import type { HomeworkAdaptationJob } from "../../ports/adaptation-queue.js";
import { HOMEWORK_ADAPTATION_QUEUE } from "../../ports/adaptation-queue.js";
import { OpenAiCompatibleTextSimplifier } from "../llm/openai-compatible-text-simplifier.js";
import { PrismaFileRepository } from "../persistence/prisma-file-repository.js";
import { PrismaHomeworkRepository } from "../persistence/prisma-homework-repository.js";
import { LocalObjectStorage } from "../storage/local-object-storage.js";
import { OpenAiCompatibleAudioGenerator } from "../tts/openai-compatible-audio-generator.js";

/**
 * Cria o worker BullMQ que consome `homework-adaptation` (BE-E5.2–E5.8).
 * Em falha definitiva, libera a chave Redis de idempotência para permitir
 * nova requisição do mesmo par atividade+perfil.
 */
export function createHomeworkAdaptationWorker(
  processHomeworkAdaptation: ProcessHomeworkAdaptation = createDefaultProcessor(),
  idempotency: IdempotencyPort = new RedisIdempotency(),
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

    void releaseIdempotencyOnFinalFailure(job, idempotency);
  });

  worker.on("completed", (job) => {
    console.log(`[worker] adaptation job ${job.id} completed`);
  });

  return worker;
}

async function releaseIdempotencyOnFinalFailure(
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

  const maxAttempts = job.opts.attempts ?? 1;
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
