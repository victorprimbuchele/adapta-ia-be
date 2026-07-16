import { z } from "zod";

import {
  hasDigit,
  hasLowercaseLetter,
  hasUppercaseLetter,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_MESSAGES,
} from "../../domain/password-policy.js";

export const createUserSchema = z.object({
  name: z
    .string({ error: "Nome é obrigatório." })
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(120, "Nome deve ter no máximo 120 caracteres."),
  email: z
    .email("E-mail inválido.")
    .trim()
    .toLowerCase(),
  password: z
    .string({ error: "Senha é obrigatória." })
    .min(PASSWORD_MIN_LENGTH, PASSWORD_POLICY_MESSAGES.minLength)
    .max(PASSWORD_MAX_LENGTH, PASSWORD_POLICY_MESSAGES.maxLength)
    .refine(hasLowercaseLetter, PASSWORD_POLICY_MESSAGES.lowercase)
    .refine(hasUppercaseLetter, PASSWORD_POLICY_MESSAGES.uppercase)
    .refine(hasDigit, PASSWORD_POLICY_MESSAGES.number),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
