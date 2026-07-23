import type { Homework } from "../../domain/homework.js";
import type {
  CreateGeneratorHomeworkData,
  HomeworkRepository,
  UpdateDraftHomeworkData,
  UpsertAdaptationHomeworkData,
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
      subject: data.subject ?? null,
      question: data.question ?? null,
      glossary: null,
      isDraft: true,
      homeworkId: null,
      learningProfileId: null,
      audioFileId: null,
      contentFileId: null,
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
    if (data.subject !== undefined) homework.subject = data.subject;
    if (data.question !== undefined) homework.question = data.question;
    homework.updatedAt = new Date();

    return homework;
  }

  async upsertAdaptation(
    data: UpsertAdaptationHomeworkData,
  ): Promise<Homework> {
    const existing = this.homeworks.find(
      (homework) =>
        homework.homeworkId === data.homeworkId &&
        homework.learningProfileId === data.learningProfileId,
    );

    if (existing) {
      existing.title = data.title;
      existing.content = data.content;
      if (data.subject !== undefined) existing.subject = data.subject;
      if (data.question !== undefined) existing.question = data.question;
      existing.glossary = data.glossary;
      existing.isDraft = false;
      existing.updatedAt = new Date();
      return existing;
    }

    const now = new Date();
    const adaptation: Homework = {
      id: `homework-${nextId++}`,
      title: data.title,
      content: data.content,
      subject: data.subject ?? null,
      question: data.question ?? null,
      glossary: data.glossary,
      isDraft: false,
      homeworkId: data.homeworkId,
      learningProfileId: data.learningProfileId,
      audioFileId: null,
      contentFileId: null,
      classId: data.classId,
      teacherId: data.teacherId,
      createdAt: now,
      updatedAt: now,
    };

    this.homeworks.push(adaptation);
    return adaptation;
  }

  async attachAudioFile(
    homeworkId: string,
    audioFileId: string,
  ): Promise<Homework> {
    const homework = this.homeworks.find((item) => item.id === homeworkId);

    if (!homework) {
      throw new Error(`Homework "${homeworkId}" not found in memory repository.`);
    }

    homework.audioFileId = audioFileId;
    homework.updatedAt = new Date();
    return homework;
  }

  async attachContentFile(
    homeworkId: string,
    contentFileId: string,
  ): Promise<Homework> {
    const homework = this.homeworks.find((item) => item.id === homeworkId);

    if (!homework) {
      throw new Error(`Homework "${homeworkId}" not found in memory repository.`);
    }

    homework.contentFileId = contentFileId;
    homework.updatedAt = new Date();
    return homework;
  }
}
