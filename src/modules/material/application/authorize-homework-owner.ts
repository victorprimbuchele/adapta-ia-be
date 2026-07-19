import type { Homework } from "../domain/homework.js";
import {
  HomeworkAccessDeniedError,
  HomeworkNotFoundError,
} from "../domain/errors.js";
import type { HomeworkRepository } from "../ports/homework-repository.js";

/**
 * Loads a homework and ensures it belongs to the authenticated teacher
 * (Epic 4, BE-E4.3). Reuse on every use case that reads or mutates a
 * specific homework so ownership is never duplicated or skipped.
 *
 * Throws `HomeworkNotFoundError` (404) when missing, and
 * `HomeworkAccessDeniedError` (403) when it belongs to another teacher.
 */
export async function authorizeHomeworkOwner(
  homeworkRepository: HomeworkRepository,
  homeworkId: string,
  teacherId: string,
): Promise<Homework> {
  const homework = await homeworkRepository.findById(homeworkId);

  if (!homework) {
    throw new HomeworkNotFoundError(homeworkId);
  }

  if (homework.teacherId !== teacherId) {
    throw new HomeworkAccessDeniedError();
  }

  return homework;
}
