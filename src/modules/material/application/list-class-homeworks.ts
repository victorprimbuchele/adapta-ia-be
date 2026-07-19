import { authorizeClassOwner } from "../../escola/application/authorize-class-owner.js";
import type { ClassRepository } from "../../escola/ports/class-repository.js";
import type { Homework } from "../domain/homework.js";
import type { HomeworkRepository } from "../ports/homework-repository.js";

/**
 * Lista as atividades (homeworks geradoras) de uma turma do professor
 * autenticado (ver Épico 4, BE-E4.5). A autorização por `teacherId` é
 * delegada a `authorizeClassOwner`.
 */
export class ListClassHomeworks {
  constructor(
    private readonly classRepository: ClassRepository,
    private readonly homeworkRepository: HomeworkRepository,
  ) {}

  async execute(classId: string, teacherId: string): Promise<Homework[]> {
    await authorizeClassOwner(this.classRepository, classId, teacherId);

    return this.homeworkRepository.findGeneratorsByClassId(classId);
  }
}
