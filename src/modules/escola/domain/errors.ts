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
