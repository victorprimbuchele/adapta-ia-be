import { authorizeClassOwner } from "./authorize-class-owner.js";
import type { ClassRepository } from "../ports/class-repository.js";

/**
 * Exclui (soft delete) uma turma do professor autenticado (ver Épico 2,
 * BE-E2.7). A autorização por `teacherId` (BE-E2.6) é delegada a
 * `authorizeClassOwner`: turma inexistente ou de outro professor nunca é
 * excluída.
 *
 * O registro nunca é removido do banco — apenas `deletedAt` é preenchido —
 * e passa a não aparecer em listagens (`findByTeacherId`) nem no detalhe
 * (`findById`).
 */
export class DeleteClass {
  constructor(private readonly classRepository: ClassRepository) {}

  async execute(classId: string, teacherId: string): Promise<void> {
    await authorizeClassOwner(this.classRepository, classId, teacherId);

    await this.classRepository.softDelete(classId);
  }
}
