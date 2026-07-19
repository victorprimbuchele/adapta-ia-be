import type {
  AdaptationJobSnapshot,
  AdaptationJobStatusPort,
} from "../../ports/adaptation-job-status.js";

/**
 * Fake de `AdaptationJobStatusPort` em memória (ADR 009 / BE-E5.9).
 */
export class InMemoryAdaptationJobStatus implements AdaptationJobStatusPort {
  readonly snapshots: AdaptationJobSnapshot[] = [];
  homeworkId = "";

  async listByHomeworkId(
    homeworkId: string,
  ): Promise<AdaptationJobSnapshot[]> {
    this.homeworkId = homeworkId;
    return [...this.snapshots];
  }
}
