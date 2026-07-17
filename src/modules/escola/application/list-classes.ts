import type { Class } from "../domain/class.js";
import type { ClassRepository } from "../ports/class-repository.js";

/**
 * Lista apenas as turmas do professor autenticado (ver Épico 2, BE-E2.4):
 * autorização por `teacherId`, nunca turmas de outros professores.
 */
export class ListClasses {
  constructor(private readonly classRepository: ClassRepository) {}

  async execute(teacherId: string): Promise<Class[]> {
    return this.classRepository.findByTeacherId(teacherId);
  }
}
