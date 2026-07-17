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
