import { AppError } from "../../../shared/errors/app-error.js";

export class EmailAlreadyInUseError extends AppError {
  constructor(email: string) {
    super(`O e-mail "${email}" já está em uso.`, 409, "EMAIL_ALREADY_IN_USE");
  }
}

/**
 * Erro genérico de autenticação: usado tanto para e-mail inexistente quanto
 * para senha incorreta, para não revelar se um e-mail está cadastrado.
 */
export class InvalidCredentialsError extends AppError {
  constructor() {
    super("E-mail ou senha inválidos.", 401, "INVALID_CREDENTIALS");
  }
}
