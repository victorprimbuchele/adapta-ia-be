import { z } from "zod";

/**
 * Optional body for enqueueing homework adaptations (Epic 5, BE-E5.1).
 * When `learningProfileIds` is omitted or empty, profiles present in the
 * homework's class are used.
 */
export const adaptHomeworkSchema = z.object({
  learningProfileIds: z
    .array(
      z
        .string({ error: "Learning profile id is required." })
        .trim()
        .min(1, "Learning profile id is required."),
    )
    .optional(),
});

export type AdaptHomeworkInput = z.infer<typeof adaptHomeworkSchema>;
