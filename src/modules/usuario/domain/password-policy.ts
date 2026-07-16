export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export const PASSWORD_POLICY_MESSAGES = {
  minLength: `Senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  maxLength: `Senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
  lowercase: "Senha deve conter ao menos uma letra minúscula.",
  uppercase: "Senha deve conter ao menos uma letra maiúscula.",
  number: "Senha deve conter ao menos um número.",
} as const;

export function hasLowercaseLetter(password: string): boolean {
  return /[a-z]/.test(password);
}

export function hasUppercaseLetter(password: string): boolean {
  return /[A-Z]/.test(password);
}

export function hasDigit(password: string): boolean {
  return /[0-9]/.test(password);
}

/**
 * Regra de negócio de "senha fraca" (Épico 1, tarefas 8/9): mesma política
 * usada na validação Zod da camada HTTP (`create-user.dto.ts`), reforçada
 * aqui como guarda de domínio para proteger o caso de uso `RegisterUser`
 * mesmo se for chamado fora do controller (ex.: scripts, seeds, workers).
 */
export function getWeakPasswordReasons(password: string): string[] {
  const reasons: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    reasons.push(PASSWORD_POLICY_MESSAGES.minLength);
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    reasons.push(PASSWORD_POLICY_MESSAGES.maxLength);
  }
  if (!hasLowercaseLetter(password)) {
    reasons.push(PASSWORD_POLICY_MESSAGES.lowercase);
  }
  if (!hasUppercaseLetter(password)) {
    reasons.push(PASSWORD_POLICY_MESSAGES.uppercase);
  }
  if (!hasDigit(password)) {
    reasons.push(PASSWORD_POLICY_MESSAGES.number);
  }

  return reasons;
}

export function isWeakPassword(password: string): boolean {
  return getWeakPasswordReasons(password).length > 0;
}
