import type { Homework } from "../domain/homework.js";
import { TeacherNotFoundError } from "../domain/errors.js";
import type { HomeworkRepository } from "../ports/homework-repository.js";
import type { TeacherRepository } from "../ports/teacher-repository.js";

export interface CreateGeneratorHomeworkInput {
  title: string;
  content: string;
  teacherId: string;
}

/**
 * Cria uma homework geradora como rascunho, sem vínculo a outra homework
 * nem a perfil de aprendizagem (ver Épico 4, BE-E4.1).
 */
export class CreateGeneratorHomework {
  constructor(
    private readonly homeworkRepository: HomeworkRepository,
    private readonly teacherRepository: TeacherRepository,
  ) {}

  async execute(input: CreateGeneratorHomeworkInput): Promise<Homework> {
    const teacher = await this.teacherRepository.findById(input.teacherId);

    if (!teacher) {
      throw new TeacherNotFoundError(input.teacherId);
    }

    return this.homeworkRepository.createGenerator({
      title: input.title,
      content: input.content,
      teacherId: input.teacherId,
    });
  }
}
