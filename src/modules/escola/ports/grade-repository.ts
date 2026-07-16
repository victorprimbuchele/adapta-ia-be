import type { Grade } from "../domain/grade.js";

export interface GradeRepository {
  findAll(): Promise<Grade[]>;
}
