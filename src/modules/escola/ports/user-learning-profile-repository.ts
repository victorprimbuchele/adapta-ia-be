import type { LearningProfile } from "../domain/learning-profile.js";

/**
 * Persistência da vinculação aluno-perfil (`UserLearningProfile` — ver
 * Épico 3, BE-E3.2). No MVP cada aluno tem no máximo um perfil ativo.
 */
export interface UserLearningProfileRepository {
  /**
   * Associa o perfil ao aluno, substituindo qualquer vínculo anterior
   * (nunca acumula múltiplos perfis).
   */
  replaceForUser(studentId: string, learningProfileId: string): Promise<void>;

  /** Retorna o `learningProfileId` ativo do aluno, se houver. */
  findLearningProfileIdByUserId(studentId: string): Promise<string | null>;

  /**
   * Perfis ativos dos alunos informados (apenas quem tem vínculo).
   * Usado na listagem da turma (ver Épico 3, BE-E3.3).
   */
  findLearningProfilesByUserIds(
    userIds: string[],
  ): Promise<ReadonlyMap<string, LearningProfile>>;
}