import { authorizeClassOwner } from "./authorize-class-owner.js";
import { StudentEmailAlreadyInUseError, StudentNotEnrolledError } from "../domain/errors.js";
import type { Student } from "../domain/student.js";
import type { ClassRepository } from "../ports/class-repository.js";
import type { StudentRepository } from "../ports/student-repository.js";
import type { UserClassRepository } from "../ports/user-class-repository.js";

export interface UpdateStudentInput {
  classId: string;
  teacherId: string;
  studentId: string;
  name: string;
  email: string;
}

/**
 * Atualiza nome/e-mail de um aluno vinculado à turma do professor
 * autenticado. Escopado por turma (como `RemoveStudentFromClass`), já que
 * aluno é um `User` compartilhável entre turmas e a edição não deve ficar
 * acessível sem o professor ter esse aluno em alguma de suas turmas.
 */
export class UpdateStudent {
  constructor(
    private readonly classRepository: ClassRepository,
    private readonly studentRepository: StudentRepository,
    private readonly userClassRepository: UserClassRepository,
  ) {}

  async execute(input: UpdateStudentInput): Promise<Student> {
    await authorizeClassOwner(this.classRepository, input.classId, input.teacherId);

    const enrolled = await this.userClassRepository.exists(input.classId, input.studentId);
    if (!enrolled) {
      throw new StudentNotEnrolledError(input.studentId);
    }

    const existingWithEmail = await this.studentRepository.findByEmail(input.email);
    if (existingWithEmail && existingWithEmail.id !== input.studentId) {
      throw new StudentEmailAlreadyInUseError(input.email);
    }

    return this.studentRepository.update(input.studentId, {
      name: input.name,
      email: input.email,
    });
  }
}
