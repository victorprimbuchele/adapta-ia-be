import { authorizeClassOwner } from "../../escola/application/authorize-class-owner.js";
import type { ClassRepository } from "../../escola/ports/class-repository.js";
import type { Homework } from "../domain/homework.js";
import { TeacherNotFoundError } from "../domain/errors.js";
import type { HomeworkRepository } from "../ports/homework-repository.js";
import type { TeacherRepository } from "../ports/teacher-repository.js";

export interface CreateGeneratorHomeworkInput {
  title: string;
  content: string;
  classId: string;
  teacherId: string;
}

/**
 * Cria uma homework geradora como rascunho, vinculada à turma do professor
 * autenticado, sem vínculo a outra homework nem a perfil de aprendizagem
 * (ver Épico 4, BE-E4.1 / BE-E4.5).
 */
export class CreateGeneratorHomework {
  constructor(
    private readonly homeworkRepository: HomeworkRepository,
    private readonly teacherRepository: TeacherRepository,
    private readonly classRepository: ClassRepository,
  ) {}

  async execute(input: CreateGeneratorHomeworkInput): Promise<Homework> {
    const teacher = await this.teacherRepository.findById(input.teacherId);

    if (!teacher) {
      throw new TeacherNotFoundError(input.teacherId);
    }

    await authorizeClassOwner(
      this.classRepository,
      input.classId,
      input.teacherId,
    );

    return this.homeworkRepository.createGenerator({
      title: input.title,
      content: input.content,
      classId: input.classId,
      teacherId: input.teacherId,
    });
  }
}
