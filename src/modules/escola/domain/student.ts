import type { LearningProfile } from "./learning-profile.js";

/**
 * Aluno vinculado a turmas via `UserClass` (ver Épico 3, BE-E3.1). Do ponto
 * de vista do módulo `escola`, aluno é a mesma entidade `User` do módulo
 * `usuario` — apenas `name`/`email` importam para a vinculação e exibição.
 */
export interface Student {
  id: string;
  name: string;
  email: string;
}

/**
 * Aluno de uma turma com o perfil de aprendizagem ativo (ou `null` se
 * ainda não vinculado) — ver Épico 3, BE-E3.3.
 */
export interface ClassStudentWithProfile extends Student {
  learningProfile: LearningProfile | null;
}
