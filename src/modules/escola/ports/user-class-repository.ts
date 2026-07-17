/**
 * Persistência da vinculação aluno-turma (`UserClass` — ver Épico 3,
 * BE-E3.1).
 */
export interface UserClassRepository {
  /** Verifica se o aluno já está vinculado à turma, para evitar duplicidade. */
  exists(classId: string, studentId: string): Promise<boolean>;
  create(classId: string, studentId: string): Promise<void>;
}
