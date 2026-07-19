import type { HomeworkAdaptationJob } from "../ports/adaptation-queue.js";

/**
 * Consome um job de adaptação enfileirado (Épico 5, BE-E5.2 / ADR 006).
 * A chamada HTTP já retornou; aqui roda o processamento assíncrono.
 * A integração com a LLM entra nos tickets seguintes do épico.
 */
export class ProcessHomeworkAdaptation {
  async execute(job: HomeworkAdaptationJob): Promise<void> {
    // Stub do worker: garante que o job é consumido sem bloquear a API.
    // BE-E5.3+ substituirá este corpo pela chamada à LLM e persistência
    // da variante adaptada.
    console.log(
      `[adaptation] process homework=${job.homeworkId} ` +
        `profile=${job.learningProfileId} teacher=${job.teacherId}`,
    );
  }
}
