import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { LearningProfile } from "../../domain/learning-profile.js";
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

  async findLearningProfilesByUserIds(
    userIds: string[],
  ): Promise<ReadonlyMap<string, LearningProfile>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const links = await this.prisma.userLearningProfile.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        learningProfile: {
          select: { id: true, name: true, prompt: true },
        },
      },
    });

    return new Map(
      links.map((link) => [link.userId, link.learningProfile]),
    );
  }
}
