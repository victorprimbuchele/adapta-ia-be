import { authorizeClassOwner } from "./authorize-class-owner.js";
import type { Class } from "../domain/class.js";
import { GradeNotFoundError } from "../domain/errors.js";
import type { ClassRepository } from "../ports/class-repository.js";
import type { GradeRepository } from "../ports/grade-repository.js";
import type { SchoolRepository } from "../ports/school-repository.js";

export interface UpdateClassInput {
  classId: string;
  teacherId: string;
  name: string;
  schoolName: string;
  gradeId: string;
}

export class UpdateClass {
  constructor(
    private readonly classRepository: ClassRepository,
    private readonly schoolRepository: SchoolRepository,
    private readonly gradeRepository: GradeRepository,
  ) {}

  async execute(input: UpdateClassInput): Promise<Class> {
    await authorizeClassOwner(
      this.classRepository,
      input.classId,
      input.teacherId,
    );

    const grade = await this.gradeRepository.findById(input.gradeId);
    if (!grade) {
      throw new GradeNotFoundError(input.gradeId);
    }

    let school = await this.schoolRepository.findByName(input.schoolName);
    if (!school) {
      school = await this.schoolRepository.create(input.schoolName, "Qualquer", "BR");
    }

    return this.classRepository.update(input.classId, {
      name: input.name,
      schoolId: school.id,
      gradeId: input.gradeId,
    });
  }
}
