import type { Student } from "./student.js";

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
  deletedAt: Date | null;
}

/**
 * Aluno vinculado a uma turma (`UserClass` — ver Épico 3, BE-E3.1).
 */
export type ClassStudent = Student;

/**
 * Detalhe de turma (ver Épico 2, BE-E2.5), incluindo os alunos vinculados.
 */
export interface ClassDetail extends Class {
  students: ClassStudent[];
}
