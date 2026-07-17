import { z } from "zod";

export const enrollStudentSchema = z.object({
  name: z
    .string({ error: "Nome do aluno é obrigatório." })
    .trim()
    .min(2, "Nome do aluno deve ter pelo menos 2 caracteres.")
    .max(120, "Nome do aluno deve ter no máximo 120 caracteres."),
  // E-mail obrigatório e válido: necessário para distribuição posterior
  // das atividades adaptadas (ver Épico 3, BE-E3.6).
  email: z
    .string({ error: "E-mail do aluno é obrigatório." })
    .trim()
    .min(1, "E-mail do aluno é obrigatório.")
    .toLowerCase()
    .pipe(z.email("E-mail inválido.")),
});

export type EnrollStudentBody = z.infer<typeof enrollStudentSchema>;
