import { authorizeClassOwner } from "./authorize-class-owner.js";
import type { Student } from "../domain/student.js";
import {
  LearningProfileNotFoundError,
  StudentAlreadyEnrolledError,
  StudentNotEnrolledError,
} from "../domain/errors.js";
import type { ClassRepository } from "../ports/class-repository.js";
import type { LearningProfileRepository } from "../ports/learning-profile-repository.js";
import type { StudentRepository } from "../ports/student-repository.js";
import type { UserClassRepository } from "../ports/user-class-repository.js";
import type { UserLearningProfileRepository } from "../ports/user-learning-profile-repository.js";

export interface UpdateStudentInput {
  classId: string;
  teacherId: string;
  studentId: string;
  name: string;
  email: string;
  learningProfileId?: string;
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
    private readonly userClassRepository: UserClassRepository,
    private readonly studentRepository: StudentRepository,
    private readonly learningProfileRepository: LearningProfileRepository,
    private readonly userLearningProfileRepository: UserLearningProfileRepository,
  ) {}

  async execute(input: UpdateStudentInput): Promise<Student> {
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

    // Mesmo critério de identidade do EnrollStudent: um aluno é identificado
    // por e-mail. Se o e-mail informado já pertence a outro cadastro (ex.: o
    // mesmo aluno já vinculado em outra turma), reaproveitamos essa
    // identidade em vez de bloquear — só é erro se esse cadastro já estiver
    // vinculado a ESTA turma (duplicidade real).
    const existingByEmail = await this.studentRepository.findByEmail(input.email);
    let updatedStudent: Student;

    if (existingByEmail && existingByEmail.id !== input.studentId) {
      const alreadyInClass = await this.userClassRepository.exists(
        input.classId,
        existingByEmail.id,
      );
      if (alreadyInClass) {
        throw new StudentAlreadyEnrolledError(input.email);
      }

      await this.userClassRepository.delete(input.classId, input.studentId);
      await this.userClassRepository.create(input.classId, existingByEmail.id);
      updatedStudent = existingByEmail;
    } else {
      updatedStudent = await this.studentRepository.update(
        input.studentId,
        {
          name: input.name,
          email: input.email,
        },
      );
    }

    if (input.learningProfileId && input.learningProfileId.trim() !== "") {
      const learningProfile = await this.learningProfileRepository.findById(
        input.learningProfileId,
      );
      if (!learningProfile) {
        throw new LearningProfileNotFoundError(input.learningProfileId);
      }

      await this.userLearningProfileRepository.replaceForUser(
        updatedStudent.id,
        learningProfile.id,
      );
    }

    return updatedStudent;
  }
}
