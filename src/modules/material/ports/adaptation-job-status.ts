import type { AdaptationQueueJobState } from "../domain/adaptation-status.js";

/**
 * Snapshot do job BullMQ de adaptação (Épico 5, BE-E5.9 / BE-E5.10).
 */
export interface AdaptationJobSnapshot {
  learningProfileId: string;
  state: AdaptationQueueJobState;
  /** Tentativas já consumidas (útil para exibir retry em andamento). */
  attemptsMade: number;
  failedReason?: string;
}

/**
 * Porta de consulta do andamento dos jobs de adaptação na fila.
 */
export interface AdaptationJobStatusPort {
  listByHomeworkId(homeworkId: string): Promise<AdaptationJobSnapshot[]>;
}
