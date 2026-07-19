import { z } from "zod";

/**
 * Shape canônico de `LearningProfile.prompt` (seed Épico 3 / BE-E5.3).
 * Usado pela skill de adaptação via LLM.
 */
export const learningProfilePromptSchema = z.object({
  code: z.string().min(1),
  kind: z.enum(["base", "composite"]),
  combines: z.array(z.string().min(1)),
  adaptations: z.object({
    simplifyText: z.boolean(),
    glossary: z.boolean(),
    tts: z.boolean(),
    microtasks: z.boolean(),
    visualStructure: z.boolean(),
    highContrast: z.boolean(),
    largeFont: z.boolean(),
    screenReader: z.boolean(),
  }),
  instructions: z.string().min(1),
});

export type LearningProfilePrompt = z.infer<typeof learningProfilePromptSchema>;

export function parseLearningProfilePrompt(
  prompt: unknown,
): LearningProfilePrompt {
  return learningProfilePromptSchema.parse(prompt);
}
