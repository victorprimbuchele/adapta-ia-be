import { z } from "zod";

export const createAtividadeSchema = z.object({
  title: z
    .string({ error: "Título da atividade é obrigatório." })
    .trim()
    .min(2, "Título da atividade deve ter pelo menos 2 caracteres.")
    .max(200, "Título da atividade deve ter no máximo 200 caracteres."),
  content: z
    .string({ error: "Conteúdo da atividade é obrigatório." })
    .trim()
    .min(1, "Conteúdo da atividade é obrigatório.")
    .max(50000, "Conteúdo da atividade deve ter no máximo 50000 caracteres."),
});

export type CreateAtividadeInput = z.infer<typeof createAtividadeSchema>;
