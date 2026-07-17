import type { ClassDetail } from "../domain/class.js";
import { ClassAccessDeniedError, ClassNotFoundError } from "../domain/errors.js";
import type { ClassRepository } from "../ports/class-repository.js";

/**
 * Obtém o detalhe de uma turma, incluindo os alunos vinculados (ver Épico 2,
 * BE-E2.5). Apenas o professor responsável pela turma pode acessá-la —
 * qualquer outro professor recebe acesso negado, mesmo que a turma exista.
 *
 * `students` está sempre vazio no momento: a vinculação de alunos à turma
 * (`UserClass`) ainda não foi implementada — ver Épico 3.
 */
export class GetClassDetail {
  constructor(private readonly classRepository: ClassRepository) {}

  async execute(classId: string, teacherId: string): Promise<ClassDetail> {
    const klass = await this.classRepository.findById(classId);

    if (!klass) {
      throw new ClassNotFoundError(classId);
    }

    if (klass.teacherId !== teacherId) {
      throw new ClassAccessDeniedError();
    }

    return { ...klass, students: [] };
  }
}
