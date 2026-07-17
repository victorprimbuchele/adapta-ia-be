import type { Class } from "../domain/class.js";
import {
  GradeNotFoundError,
  SchoolNotFoundError,
  TeacherNotFoundError,
} from "../domain/errors.js";
import type { ClassRepository } from "../ports/class-repository.js";
import type { GradeRepository } from "../ports/grade-repository.js";
import type { SchoolRepository } from "../ports/school-repository.js";
import type { TeacherRepository } from "../ports/teacher-repository.js";

export interface CreateClassInput {
  name: string;
  schoolId: string;
  gradeId: string;
  teacherId: string;
}

/**
 * Cria uma turma vinculada a uma escola, a uma série e a um professor
 * responsável existentes (ver Épico 2, BE-E2.8: turma sempre precisa dos
 * três). O professor responsável é sempre o usuário autenticado que criou a
 * turma.
 */
export class CreateClass {
  constructor(
    private readonly classRepository: ClassRepository,
    private readonly schoolRepository: SchoolRepository,
    private readonly gradeRepository: GradeRepository,
    private readonly teacherRepository: TeacherRepository,
  ) {}

  async execute(input: CreateClassInput): Promise<Class> {
    const [school, grade, teacher] = await Promise.all([
      this.schoolRepository.findById(input.schoolId),
      this.gradeRepository.findById(input.gradeId),
      this.teacherRepository.findById(input.teacherId),
    ]);

    if (!school) {
      throw new SchoolNotFoundError(input.schoolId);
    }
    if (!grade) {
      throw new GradeNotFoundError(input.gradeId);
    }
    if (!teacher) {
      throw new TeacherNotFoundError(input.teacherId);
    }

    return this.classRepository.create({
      name: input.name,
      schoolId: input.schoolId,
      gradeId: input.gradeId,
      teacherId: input.teacherId,
    });
  }
}
