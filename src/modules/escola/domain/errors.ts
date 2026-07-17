import { AppError } from "../../../shared/errors/app-error.js";

/**
 * Escola informada na criação de turma não existe entre os dados de
 * referência (populados via seed — ver Épico 2).
 */
export class SchoolNotFoundError extends AppError {
  constructor(schoolId: string) {
    super(`Escola "${schoolId}" não encontrada.`, 404, "SCHOOL_NOT_FOUND");
  }
}

/**
 * Série informada na criação de turma não existe entre os dados de
 * referência (populados via seed — ver Épico 2).
 */
export class GradeNotFoundError extends AppError {
  constructor(gradeId: string) {
    super(`Série "${gradeId}" não encontrada.`, 404, "GRADE_NOT_FOUND");
  }
}

/**
 * Professor responsável informado na criação de turma não corresponde a
 * nenhum usuário existente (ver Épico 2, BE-E2.8: turma sempre precisa de
 * escola, série e professor responsável).
 */
export class TeacherNotFoundError extends AppError {
  constructor(teacherId: string) {
    super(`Professor "${teacherId}" não encontrado.`, 404, "TEACHER_NOT_FOUND");
  }
}

/**
 * Turma informada não existe.
 */
export class ClassNotFoundError extends AppError {
  constructor(classId: string) {
    super(`Turma "${classId}" não encontrada.`, 404, "CLASS_NOT_FOUND");
  }
}

/**
 * Turma existe, mas não pertence ao professor autenticado (ver Épico 2,
 * BE-E2.5: professor só pode ver/editar suas próprias turmas).
 */
export class ClassAccessDeniedError extends AppError {
  constructor() {
    super(
      "Você não tem permissão para acessar esta turma.",
      403,
      "CLASS_ACCESS_DENIED",
    );
  }
}

/**
 * Aluno (identificado por e-mail) já está vinculado a esta turma. Evita
 * vinculações duplicadas via `UserClass` (ver Épico 3, BE-E3.1).
 */
export class StudentAlreadyEnrolledError extends AppError {
  constructor(email: string) {
    super(
      `O aluno "${email}" já está vinculado a esta turma.`,
      409,
      "STUDENT_ALREADY_ENROLLED",
    );
  }
}
