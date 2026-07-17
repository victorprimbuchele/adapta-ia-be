import type { Class } from "../domain/class.js";
import { ClassAccessDeniedError, ClassNotFoundError } from "../domain/errors.js";
import type { ClassRepository } from "../ports/class-repository.js";

/**
 * Busca uma turma e garante que ela pertence ao professor autenticado (ver
 * Épico 2, BE-E2.6: autorização por `teacherId`). Deve ser reutilizado por
 * todo caso de uso que consulte ou modifique uma turma específica — detalhe,
 * edição, exclusão — para que a regra nunca seja duplicada (ou esquecida)
 * endpoint a endpoint.
 *
 * Lança `ClassNotFoundError` (404) se a turma não existir, e
 * `ClassAccessDeniedError` (403) se existir mas pertencer a outro professor.
 */
export async function authorizeClassOwner(
  classRepository: ClassRepository,
  classId: string,
  teacherId: string,
): Promise<Class> {
  const klass = await classRepository.findById(classId);

  if (!klass) {
    throw new ClassNotFoundError(classId);
  }

  if (klass.teacherId !== teacherId) {
    throw new ClassAccessDeniedError();
  }

  return klass;
}
