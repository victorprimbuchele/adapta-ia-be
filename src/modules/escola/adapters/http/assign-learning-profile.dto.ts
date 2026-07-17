import { z } from "zod";

export const assignLearningProfileSchema = z.object({
  learningProfileId: z
    .string({ error: "Perfil de aprendizagem é obrigatório." })
    .trim()
    .min(1, "Perfil de aprendizagem é obrigatório."),
});

export type AssignLearningProfileBody = z.infer<
  typeof assignLearningProfileSchema
>;
