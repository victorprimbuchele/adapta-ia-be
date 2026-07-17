import type { PrismaClient } from "../../../../generated/prisma/client.js";
import type { LearningProfile } from "../../domain/learning-profile.js";
import type { LearningProfileRepository } from "../../ports/learning-profile-repository.js";

/**
 * Implementação de `LearningProfileRepository` sobre a tabela
 * `learning_profiles` (catálogo de perfis — ver Épico 3, BE-E3.2).
 */
export class PrismaLearningProfileRepository
  implements LearningProfileRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<LearningProfile | null> {
    return this.prisma.learningProfile.findUnique({
      where: { id },
      select: { id: true, name: true, prompt: true },
    });
  }
}
