/**
 * Payload enfileirado para adaptar uma homework geradora a um perfil
 * (ver Épico 5, BE-E5.1 / BE-E5.2 / ADR 006).
 */
export interface HomeworkAdaptationJob {
  homeworkId: string;
  learningProfileId: string;
  teacherId: string;
}

/**
 * Porta de enfileiramento de adaptações. A API só adiciona jobs e retorna
 * (202); o worker consome a fila sem bloquear a resposta HTTP nem a LLM.
 */
export interface AdaptationQueue {
  enqueue(jobs: HomeworkAdaptationJob[]): Promise<void>;
}

/** Nome estável da fila BullMQ de adaptação de homework (BE-E5.2). */
export const HOMEWORK_ADAPTATION_QUEUE = "homework-adaptation";
