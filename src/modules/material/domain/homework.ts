/**
 * Homework — material created by the teacher via the structured form
 * (Epic 4, BE-E4.1). The generator is born as a draft (`isDraft = true`)
 * with no link to another homework or learning profile (`homeworkId` and
 * `learningProfileId` null).
 */
export interface Homework {
  id: string;
  title: string;
  content: string;
  isDraft: boolean;
  homeworkId: string | null;
  learningProfileId: string | null;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
}
