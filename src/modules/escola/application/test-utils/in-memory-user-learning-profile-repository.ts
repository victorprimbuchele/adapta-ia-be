import type { UserLearningProfileRepository } from "../../ports/user-learning-profile-repository.js";

interface UserLearningProfileLink {
  studentId: string;
  learningProfileId: string;
}

/**
 * Fake de `UserLearningProfileRepository` em memória, usado apenas nos
 * testes de comportamento das camadas de application/domain (ver ADR 009).
 * Garante a regra do MVP: no máximo um perfil ativo por aluno.
 */
export class InMemoryUserLearningProfileRepository
  implements UserLearningProfileRepository
{
  readonly links: UserLearningProfileLink[] = [];

  async replaceForUser(
    studentId: string,
    learningProfileId: string,
  ): Promise<void> {
    const existingIndex = this.links.findIndex(
      (link) => link.studentId === studentId,
    );
    if (existingIndex >= 0) {
      this.links[existingIndex] = { studentId, learningProfileId };
      return;
    }
    this.links.push({ studentId, learningProfileId });
  }

  async findLearningProfileIdByUserId(
    studentId: string,
  ): Promise<string | null> {
    return (
      this.links.find((link) => link.studentId === studentId)
        ?.learningProfileId ?? null
    );
  }
}
