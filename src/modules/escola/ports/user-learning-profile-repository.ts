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
}