import { z } from "zod";

/**
 * Query de `GET /homeworks/:id/pdf` (Épico 6, BE-E6.3).
 * Obrigatório quando `:id` é a homework geradora; omitido quando `:id` é a variante.
 */
export const getHomeworkPdfQuerySchema = z.object({
  learningProfileId: z.string().trim().min(1).optional(),
});

export type GetHomeworkPdfQuery = z.infer<typeof getHomeworkPdfQuerySchema>;
