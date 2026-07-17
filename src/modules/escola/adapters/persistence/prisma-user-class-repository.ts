import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { UserClassRepository } from "../../ports/user-class-repository.js";

/**
 * Implementação de `UserClassRepository` sobre a tabela `user_classes`
 * (vinculação aluno-turma — ver Épico 3, BE-E3.1).
 */
export class PrismaUserClassRepository implements UserClassRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async exists(classId: string, studentId: string): Promise<boolean> {
    const link = await this.prisma.userClass.findUnique({
      where: {
        userId_classId: { userId: studentId, classId },
      },
      select: { id: true },
    });

    return link !== null;
  }

  async create(classId: string, studentId: string): Promise<void> {
    await this.prisma.userClass.create({
      data: { classId, userId: studentId },
    });
  }

  async listStudentIdsByClassId(classId: string): Promise<string[]> {
    const enrollments = await this.prisma.userClass.findMany({
      where: { classId },
      orderBy: { createdAt: "asc" },
      select: { userId: true },
    });

    return enrollments.map((enrollment) => enrollment.userId);
  }
}
