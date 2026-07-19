import { z } from "zod";

/**
 * Structured form payload for creating a homework (Epic 4, BE-E4.2 / ADR 012).
 * Required fields reject incomplete payloads with clear HTTP-boundary errors.
 */
export const createHomeworkSchema = z.object({
  title: z
    .string({ error: "Homework title is required." })
    .trim()
    .min(2, "Homework title must have at least 2 characters.")
    .max(200, "Homework title must have at most 200 characters."),
  content: z
    .string({ error: "Homework main content is required." })
    .trim()
    .min(1, "Homework main content is required.")
    .max(50000, "Homework main content must have at most 50000 characters."),
  question: z
    .string({ error: "Homework question is required." })
    .trim()
    .min(1, "Homework question is required.")
    .max(10000, "Homework question must have at most 10000 characters."),
  subject: z
    .string({ error: "Subject is required." })
    .trim()
    .min(2, "Subject must have at least 2 characters.")
    .max(120, "Subject must have at most 120 characters."),
  classId: z
    .string({ error: "Class is required." })
    .trim()
    .min(1, "Class is required."),
});

export type CreateHomeworkInput = z.infer<typeof createHomeworkSchema>;
