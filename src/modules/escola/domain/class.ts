/**
 * Turma — vinculada a uma escola e a uma série de referência, com o
 * professor responsável sendo sempre o usuário autenticado que a criou
 * (ver Épico 2, BE-E2.3).
 */
export interface Class {
  id: string;
  name: string;
  schoolId: string;
  gradeId: string;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aluno vinculado a uma turma. A vinculação (`UserClass`) ainda não existe
 * no MVP — ver Épico 3 — por isso `ClassDetail.students` está sempre vazio
 * até essa funcionalidade ser implementada.
 */
export interface ClassStudent {
  id: string;
  name: string;
  email: string;
}

/**
 * Detalhe de turma (ver Épico 2, BE-E2.5), incluindo os alunos vinculados.
 */
export interface ClassDetail extends Class {
  students: ClassStudent[];
}
