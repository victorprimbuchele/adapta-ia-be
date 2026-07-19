import type { Homework } from "../../domain/homework.js";
import type {
  CreateGeneratorHomeworkData,
  HomeworkRepository,
} from "../../ports/homework-repository.js";

let nextId = 1;

/**
 * Fake de `HomeworkRepository` em memória, usado apenas nos testes de
 * comportamento das camadas de application/domain (ver ADR 009).
 */
export class InMemoryHomeworkRepository implements HomeworkRepository {
  readonly homeworks: Homework[] = [];

  async createGenerator(data: CreateGeneratorHomeworkData): Promise<Homework> {
    const now = new Date();
    const homework: Homework = {
      id: `homework-${nextId++}`,
      title: data.title,
      content: data.content,
      isDraft: true,
      homeworkId: null,
      learningProfileId: null,
      teacherId: data.teacherId,
      createdAt: now,
      updatedAt: now,
    };

    this.homeworks.push(homework);
    return homework;
  }
}
