import type {
  AdaptationQueue,
  HomeworkAdaptationJob,
} from "../../ports/adaptation-queue.js";

/**
 * Fake de `AdaptationQueue` em memória, usado apenas nos testes de
 * comportamento das camadas de application/domain (ver ADR 009).
 */
export class InMemoryAdaptationQueue implements AdaptationQueue {
  readonly jobs: HomeworkAdaptationJob[] = [];

  async enqueue(jobs: HomeworkAdaptationJob[]): Promise<void> {
    this.jobs.push(...jobs);
  }
}
