import { z } from "zod";

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
    .min(8, "Senha deve ter pelo menos 8 caracteres.")
    .max(72, "Senha deve ter no máximo 72 caracteres.")
    .refine(
      (password) => /[a-z]/.test(password),
      "Senha deve conter ao menos uma letra minúscula.",
    )
    .refine(
      (password) => /[A-Z]/.test(password),
      "Senha deve conter ao menos uma letra maiúscula.",
    )
    .refine(
      (password) => /[0-9]/.test(password),
      "Senha deve conter ao menos um número.",
    ),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
