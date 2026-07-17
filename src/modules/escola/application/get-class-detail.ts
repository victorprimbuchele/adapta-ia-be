import { authorizeClassOwner } from "./authorize-class-owner.js";
import type { ClassDetail } from "../domain/class.js";
import type { ClassRepository } from "../ports/class-repository.js";

/**
 * Obtém o detalhe de uma turma, incluindo os alunos vinculados (ver Épico 2,
 * BE-E2.5). A autorização por `teacherId` (ver BE-E2.6) é delegada a
 * `authorizeClassOwner`, garantindo que apenas o professor responsável
 * acesse a turma.
 *
 * `students` está sempre vazio no momento: a vinculação de alunos à turma
 * (`UserClass`) ainda não foi implementada — ver Épico 3.
 */
export class GetClassDetail {
  constructor(private readonly classRepository: ClassRepository) {}

  async execute(classId: string, teacherId: string): Promise<ClassDetail> {
    const klass = await authorizeClassOwner(
      this.classRepository,
      classId,
      teacherId,
    );

    return { ...klass, students: [] };
  }
}
