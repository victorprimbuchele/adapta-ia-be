import type { Class } from "../domain/class.js";
import { GradeNotFoundError, SchoolNotFoundError } from "../domain/errors.js";
import type { ClassRepository } from "../ports/class-repository.js";
import type { GradeRepository } from "../ports/grade-repository.js";
import type { SchoolRepository } from "../ports/school-repository.js";

export interface CreateClassInput {
  name: string;
  schoolId: string;
  gradeId: string;
  teacherId: string;
}

/**
 * Cria uma turma vinculada a uma escola e a uma série existentes (dados de
 * referência do Épico 2), com o professor responsável definido sempre como
 * o usuário autenticado que a criou.
 */
export class CreateClass {
  constructor(
    private readonly classRepository: ClassRepository,
    private readonly schoolRepository: SchoolRepository,
    private readonly gradeRepository: GradeRepository,
  ) {}

  async execute(input: CreateClassInput): Promise<Class> {
    const [school, grade] = await Promise.all([
      this.schoolRepository.findById(input.schoolId),
      this.gradeRepository.findById(input.gradeId),
    ]);

    if (!school) {
      throw new SchoolNotFoundError(input.schoolId);
    }
    if (!grade) {
      throw new GradeNotFoundError(input.gradeId);
    }

    return this.classRepository.create({
      name: input.name,
      schoolId: input.schoolId,
      gradeId: input.gradeId,
      teacherId: input.teacherId,
    });
  }
}
