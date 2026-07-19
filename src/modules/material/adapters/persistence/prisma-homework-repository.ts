import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { Homework } from "../../domain/homework.js";
import type {
  CreateGeneratorHomeworkData,
  HomeworkRepository,
  UpdateDraftHomeworkData,
} from "../../ports/homework-repository.js";

/**
 * Implementação de `HomeworkRepository` sobre a tabela `homeworks`
 * (ver Épico 4, BE-E4.1 / BE-E4.3 / BE-E4.5).
 */
export class PrismaHomeworkRepository implements HomeworkRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createGenerator(data: CreateGeneratorHomeworkData): Promise<Homework> {
    return this.prisma.homework.create({
      data: {
        title: data.title,
        content: data.content,
        classId: data.classId,
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

  async findAdaptationsByHomeworkId(homeworkId: string): Promise<Homework[]> {
    return this.prisma.homework.findMany({
      where: { homeworkId },
      orderBy: { createdAt: "asc" },
    });
  }

  async findGeneratorsByClassId(classId: string): Promise<Homework[]> {
    return this.prisma.homework.findMany({
      where: {
        classId,
        homeworkId: null,
      },
      orderBy: { createdAt: "desc" },
    });
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
