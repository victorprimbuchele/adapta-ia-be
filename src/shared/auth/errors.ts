import { AppError } from "../errors/app-error.js";

export class MissingTokenError extends AppError {
  constructor() {
    super("Token de autenticação não informado.", 401, "MISSING_TOKEN");
  }
}

export class InvalidTokenError extends AppError {
  constructor() {
    super("Token de autenticação inválido.", 401, "INVALID_TOKEN");
  }
}

export class ExpiredTokenError extends AppError {
  constructor() {
    super("Token de autenticação expirado.", 401, "TOKEN_EXPIRED");
  }
}
