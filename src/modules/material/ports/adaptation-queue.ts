/**
 * Payload enfileirado para adaptar uma homework geradora a um perfil
 * (ver Épico 5, BE-E5.1 / ADR 006).
 */
export interface HomeworkAdaptationJob {
  homeworkId: string;
  learningProfileId: string;
  teacherId: string;
}

/**
 * Porta de enfileiramento de adaptações. A API só adiciona jobs e retorna;
 * o worker consome a fila sem bloquear a resposta HTTP.
 */
export interface AdaptationQueue {
  enqueue(jobs: HomeworkAdaptationJob[]): Promise<void>;
}

/** Nome estável da fila BullMQ de adaptação de homework. */
export const HOMEWORK_ADAPTATION_QUEUE = "homework-adaptation";
