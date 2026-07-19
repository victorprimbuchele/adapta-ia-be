import { Worker } from "bullmq";

import { prisma } from "../../../../shared/infra/prisma-client.js";
import { getRedisConnectionOptions } from "../../../../shared/infra/redis.js";
import { PrismaLearningProfileRepository } from "../../../escola/adapters/persistence/prisma-learning-profile-repository.js";
import { ProcessHomeworkAdaptation } from "../../application/process-homework-adaptation.js";
import type { HomeworkAdaptationJob } from "../../ports/adaptation-queue.js";
import { HOMEWORK_ADAPTATION_QUEUE } from "../../ports/adaptation-queue.js";
import { OpenAiCompatibleTextSimplifier } from "../llm/openai-compatible-text-simplifier.js";
import { PrismaFileRepository } from "../persistence/prisma-file-repository.js";
import { PrismaHomeworkRepository } from "../persistence/prisma-homework-repository.js";
import { LocalObjectStorage } from "../storage/local-object-storage.js";
import { OpenAiCompatibleAudioGenerator } from "../tts/openai-compatible-audio-generator.js";

/**
 * Cria o worker BullMQ que consome `homework-adaptation` (BE-E5.2–E5.7).
 * O processo HTTP só enfileira; aqui a LLM adapta, o TTS gera áudio e o
 * áudio é persistido em storage + `File` vinculado à variante.
 */
export function createHomeworkAdaptationWorker(
  processHomeworkAdaptation: ProcessHomeworkAdaptation = createDefaultProcessor(),
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
