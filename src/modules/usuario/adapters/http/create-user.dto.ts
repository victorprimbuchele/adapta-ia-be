import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string({ error: "Nome é obrigatório." })
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(120, "Nome deve ter no máximo 120 caracteres."),
  email: z
    .email("E-mail inválido."),
  password: z
    .string({ error: "Senha é obrigatória." })
    .min(8, "Senha deve ter pelo menos 8 caracteres.")
    .max(72, "Senha deve ter no máximo 72 caracteres."),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
