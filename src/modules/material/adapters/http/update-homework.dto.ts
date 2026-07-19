import { z } from "zod";

import { createHomeworkSchema } from "./create-homework.dto.js";

/**
 * Structured form payload for updating a draft homework (Epic 4, BE-E4.3).
 * Same required fields as create — incomplete payloads are rejected at the
 * HTTP boundary with clear per-field errors.
 */
export const updateHomeworkSchema = createHomeworkSchema;

export type UpdateHomeworkInput = z.infer<typeof updateHomeworkSchema>;
