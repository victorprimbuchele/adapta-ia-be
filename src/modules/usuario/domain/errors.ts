import { AppError } from "../../../shared/errors/app-error.js";

export class EmailAlreadyInUseError extends AppError {
  constructor(email: string) {
    super(`O e-mail "${email}" já está em uso.`, 409, "EMAIL_ALREADY_IN_USE");
  }
}
