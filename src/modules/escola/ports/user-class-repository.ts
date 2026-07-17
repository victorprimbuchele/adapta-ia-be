/**
 * Persistência da vinculação aluno-turma (`UserClass` — ver Épico 3,
 * BE-E3.1).
 */
export interface UserClassRepository {
  /** Verifica se o aluno já está vinculado à turma, para evitar duplicidade. */
  exists(classId: string, studentId: string): Promise<boolean>;
  create(classId: string, studentId: string): Promise<void>;
  /** Remove a vinculação aluno-turma (ver Épico 3, BE-E3.4). */
  delete(classId: string, studentId: string): Promise<void>;
  /** IDs dos alunos vinculados à turma, na ordem de matrícula. */
  listStudentIdsByClassId(classId: string): Promise<string[]>;
}
