import { authorizeClassOwner } from "./authorize-class-owner.js";
import { StudentNotEnrolledError } from "../domain/errors.js";
import type { ClassRepository } from "../ports/class-repository.js";
import type { UserClassRepository } from "../ports/user-class-repository.js";

export interface RemoveStudentFromClassInput {
  classId: string;
  teacherId: string;
  studentId: string;
}

/**
 * Remove a vinculação de um aluno à turma via `UserClass` (ver Épico 3,
 * BE-E3.4). A autorização por `teacherId` é delegada a `authorizeClassOwner`.
 *
 * Apenas o vínculo com a turma é removido — o cadastro do aluno e o perfil
 * de aprendizagem permanecem intactos (o aluno deixa de aparecer na
 * listagem da turma).
 */
export class RemoveStudentFromClass {
  constructor(
    private readonly classRepository: ClassRepository,
    private readonly userClassRepository: UserClassRepository,
  ) {}

  async execute(input: RemoveStudentFromClassInput): Promise<void> {
    await authorizeClassOwner(
      this.classRepository,
      input.classId,
      input.teacherId,
    );

    const enrolled = await this.userClassRepository.exists(
      input.classId,
      input.studentId,
    );
    if (!enrolled) {
      throw new StudentNotEnrolledError(input.studentId);
    }

    await this.userClassRepository.delete(input.classId, input.studentId);
  }
}
