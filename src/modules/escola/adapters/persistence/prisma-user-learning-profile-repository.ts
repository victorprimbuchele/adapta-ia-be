import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { UserLearningProfileRepository } from "../../ports/user-learning-profile-repository.js";

/**
 * Implementação de `UserLearningProfileRepository` sobre a tabela
 * `user_learning_profiles` (ver Épico 3, BE-E3.2). Usa `upsert` na
 * constraint única de `userId` para garantir no máximo um perfil ativo
 * por aluno (substituição, não acumulação).
 */
export class PrismaUserLearningProfileRepository
  implements UserLearningProfileRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async replaceForUser(
    studentId: string,
    learningProfileId: string,
  ): Promise<void> {
    await this.prisma.userLearningProfile.upsert({
      where: { userId: studentId },
      create: { userId: studentId, learningProfileId },
      update: { learningProfileId },
    });
  }

  async findLearningProfileIdByUserId(
    studentId: string,
  ): Promise<string | null> {
    const link = await this.prisma.userLearningProfile.findUnique({
      where: { userId: studentId },
      select: { learningProfileId: true },
    });

    return link?.learningProfileId ?? null;
  }
}
