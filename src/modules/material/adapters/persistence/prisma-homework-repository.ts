import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { Homework } from "../../domain/homework.js";
import type {
  CreateGeneratorHomeworkData,
  HomeworkRepository,
} from "../../ports/homework-repository.js";

/**
 * Implementação de `HomeworkRepository` sobre a tabela `homeworks`
 * (ver Épico 4, BE-E4.1).
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
}
