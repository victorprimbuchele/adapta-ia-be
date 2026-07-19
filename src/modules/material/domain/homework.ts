/**
 * Homework — material created by the teacher via the structured form
 * (Epic 4, BE-E4.1). The generator is born as a draft (`isDraft = true`)
 * with no link to another homework or learning profile (`homeworkId` and
 * `learningProfileId` null). Always belongs to a class (`classId`).
 */
export interface Homework {
  id: string;
  title: string;
  content: string;
  isDraft: boolean;
  homeworkId: string | null;
  learningProfileId: string | null;
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
