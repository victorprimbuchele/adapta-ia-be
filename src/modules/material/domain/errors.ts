import { AppError } from "../../../shared/errors/app-error.js";

/**
 * Professor responsável informado na criação da atividade não corresponde
 * a nenhum usuário existente (ver Épico 4, BE-E4.1).
 */
export class TeacherNotFoundError extends AppError {
  constructor(teacherId: string) {
    super(`Professor "${teacherId}" não encontrado.`, 404, "TEACHER_NOT_FOUND");
  }
}
