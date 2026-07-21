import type { Class } from "../domain/class.js";
import {
  GradeNotFoundError,
  TeacherNotFoundError,
} from "../domain/errors.js";
import type { ClassRepository } from "../ports/class-repository.js";
import type { GradeRepository } from "../ports/grade-repository.js";
import type { SchoolRepository } from "../ports/school-repository.js";
import type { TeacherRepository } from "../ports/teacher-repository.js";

export interface CreateClassInput {
  name: string;
  schoolName: string;
  gradeId: string;
  teacherId: string;
}

/**
 * Cria uma turma vinculada a uma escola (por nome, criando se não existir), a uma série e a um professor
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
    const [grade, teacher] = await Promise.all([
      this.gradeRepository.findById(input.gradeId),
      this.teacherRepository.findById(input.teacherId),
    ]);

    if (!grade) {
      throw new GradeNotFoundError(input.gradeId);
    }
    if (!teacher) {
      throw new TeacherNotFoundError(input.teacherId);
    }

    let school = await this.schoolRepository.findByName(input.schoolName);
    if (!school) {
      school = await this.schoolRepository.create(input.schoolName, "Qualquer", "BR");
    }

    return this.classRepository.create({
      name: input.name,
      schoolId: school.id,
      gradeId: input.gradeId,
      teacherId: input.teacherId,
    });
  }
}
