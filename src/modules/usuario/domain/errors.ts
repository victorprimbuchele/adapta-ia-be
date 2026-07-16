import { AppError } from "../../../shared/errors/app-error.js";

export class EmailAlreadyInUseError extends AppError {
  constructor(email: string) {
    super(`O e-mail "${email}" já está em uso.`, 409, "EMAIL_ALREADY_IN_USE");
  }
}

/**
 * Senha que não atende à política mínima de segurança (ver
 * `domain/password-policy.ts`). `reasons` traz cada regra violada, útil
 * para exibir feedback detalhado ao usuário.
 */
export class WeakPasswordError extends AppError {
  readonly reasons: string[];

  constructor(reasons: string[]) {
    super(
      reasons[0] ?? "Senha não atende aos requisitos mínimos de segurança.",
      422,
      "WEAK_PASSWORD",
    );
    this.reasons = reasons;
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

/**
 * Usuário identificado por um token válido mas que não existe mais na base
 * (ex.: removido após o token ter sido emitido).
 */
export class UserNotFoundError extends AppError {
  constructor() {
    super("Usuário não encontrado.", 404, "USER_NOT_FOUND");
  }
}
