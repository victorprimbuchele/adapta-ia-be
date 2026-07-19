import { AppError } from "../../../shared/errors/app-error.js";

/**
 * Teacher informed when creating a homework does not match any existing
 * user (Epic 4, BE-E4.1).
 */
export class TeacherNotFoundError extends AppError {
  constructor(teacherId: string) {
    super(`Professor "${teacherId}" não encontrado.`, 404, "TEACHER_NOT_FOUND");
  }
}

/**
 * Homework informed does not exist (Epic 4, BE-E4.3).
 */
export class HomeworkNotFoundError extends AppError {
  constructor(homeworkId: string) {
    super(`Homework "${homeworkId}" não encontrada.`, 404, "HOMEWORK_NOT_FOUND");
  }
}

/**
 * Homework exists, but does not belong to the authenticated teacher
 * (Epic 4, BE-E4.3).
 */
export class HomeworkAccessDeniedError extends AppError {
  constructor() {
    super(
      "Você não tem permissão para acessar esta homework.",
      403,
      "HOMEWORK_ACCESS_DENIED",
    );
  }
}

/**
 * Only drafts can be edited via PATCH (Epic 4, BE-E4.3).
 */
export class HomeworkNotDraftError extends AppError {
  constructor(homeworkId: string) {
    super(
      `Homework "${homeworkId}" não é um rascunho e não pode ser editada.`,
      409,
      "HOMEWORK_NOT_DRAFT",
    );
  }
}
