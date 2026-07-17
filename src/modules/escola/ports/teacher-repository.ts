import type { Teacher } from "../domain/teacher.js";

export interface TeacherRepository {
  findById(id: string): Promise<Teacher | null>;
}
