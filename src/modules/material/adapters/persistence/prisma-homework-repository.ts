import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { Homework } from "../../domain/homework.js";
import type {
  CreateGeneratorHomeworkData,
  HomeworkRepository,
  UpdateDraftHomeworkData,
} from "../../ports/homework-repository.js";

/**
 * Implementação de `HomeworkRepository` sobre a tabela `homeworks`
 * (ver Épico 4, BE-E4.1 / BE-E4.3).
 */
export class PrismaHomeworkRepository implements HomeworkRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createGenerator(data: CreateGeneratorHomeworkData): Promise<Homework> {
    return this.prisma.homework.create({
      data: {
        title: data.title,
        content: data.content,
        teacherId: data.teacherId,
        isDraft: true,
        homeworkId: null,
        learningProfileId: null,
      },
    });
  }

  async findById(id: string): Promise<Homework | null> {
    return this.prisma.homework.findUnique({ where: { id } });
  }

  async updateDraft(
    id: string,
    data: UpdateDraftHomeworkData,
  ): Promise<Homework> {
    return this.prisma.homework.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
      },
    });
  }
}
