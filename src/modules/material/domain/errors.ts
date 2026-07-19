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
