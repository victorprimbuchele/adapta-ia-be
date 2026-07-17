import { z } from "zod";

export const enrollStudentSchema = z.object({
  name: z
    .string({ error: "Nome do aluno é obrigatório." })
    .trim()
    .min(2, "Nome do aluno deve ter pelo menos 2 caracteres.")
    .max(120, "Nome do aluno deve ter no máximo 120 caracteres."),
  email: z.email("E-mail inválido.").trim().toLowerCase(),
});

export type EnrollStudentBody = z.infer<typeof enrollStudentSchema>;
