import type { Homework } from "../../domain/homework.js";
import type {
  CreateGeneratorHomeworkData,
  HomeworkRepository,
  UpdateDraftHomeworkData,
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
      classId: data.classId,
      teacherId: data.teacherId,
      createdAt: now,
      updatedAt: now,
    };

    this.homeworks.push(homework);
    return homework;
  }

  async findById(id: string): Promise<Homework | null> {
    return this.homeworks.find((homework) => homework.id === id) ?? null;
  }

  async findAdaptationsByHomeworkId(homeworkId: string): Promise<Homework[]> {
    return this.homeworks
      .filter((homework) => homework.homeworkId === homeworkId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async findGeneratorsByClassId(classId: string): Promise<Homework[]> {
    return this.homeworks
      .filter(
        (homework) =>
          homework.classId === classId && homework.homeworkId === null,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateDraft(
    id: string,
    data: UpdateDraftHomeworkData,
  ): Promise<Homework> {
    const homework = this.homeworks.find((item) => item.id === id);

    if (!homework) {
      throw new Error(`Homework "${id}" not found in memory repository.`);
    }

    homework.title = data.title;
    homework.content = data.content;
    homework.updatedAt = new Date();

    return homework;
  }
}
