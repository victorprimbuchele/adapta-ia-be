/**
 * Perfil de aprendizagem (simples ou composto) do catálogo de referência
 * (ver Épico 3, BE-E3.2). Dificuldades combinadas são um único perfil
 * composto — não múltiplos vínculos simultâneos ao aluno.
 */
export interface LearningProfile {
  id: string;
  name: string;
  prompt: unknown;
}

/**
 * Vinculação ativa entre um aluno e um perfil de aprendizagem
 * (`UserLearningProfile` — no máximo um por aluno no MVP).
 */
export interface StudentLearningProfileLink {
  studentId: string;
  learningProfileId: string;
  learningProfile: LearningProfile;
}
