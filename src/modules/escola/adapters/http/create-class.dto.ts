import { z } from "zod";

export const createClassSchema = z.object({
  name: z
    .string({ error: "Nome da turma é obrigatório." })
    .trim()
    .min(2, "Nome da turma deve ter pelo menos 2 caracteres.")
    .max(120, "Nome da turma deve ter no máximo 120 caracteres."),
  schoolId: z
    .string({ error: "Escola é obrigatória." })
    .trim()
    .min(1, "Escola é obrigatória."),
  gradeId: z
    .string({ error: "Série é obrigatória." })
    .trim()
    .min(1, "Série é obrigatória."),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
