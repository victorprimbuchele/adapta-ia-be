import type { GlossaryEntry } from "./glossary.js";

/**
 * Homework — material created by the teacher via the structured form
 * (Epic 4, BE-E4.1). The generator is born as a draft (`isDraft = true`)
 * with no link to another homework or learning profile (`homeworkId` and
 * `learningProfileId` null — BE-E4.7). Always belongs to a class (`classId`).
 * Adapted variants link to the generator (`homeworkId`) and learning
 * profile (`learningProfileId`), may carry a structured `glossary`
 * (Épico 5, BE-E5.5 / BE-E5.4), and may point to TTS audio via
 * `audioFileId` (BE-E5.7). Glossário e áudio nunca existem na geradora
 * — só em variantes (BE-E5.11).
 */
export interface Homework {
  id: string;
  title: string;
  content: string;
  subject?: string | null;
  question?: string | null;
  glossary: GlossaryEntry[] | null;
  isDraft: boolean;
  homeworkId: string | null;
  learningProfileId: string | null;
  audioFileId: string | null;
  classId: string;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Detalhe da homework (ver Épico 4, BE-E4.4), incluindo as adaptações/
 * variantes vinculadas à geradora via `homeworkId`.
 */
export interface HomeworkDetail extends Homework {
  adaptations: Homework[];
}
