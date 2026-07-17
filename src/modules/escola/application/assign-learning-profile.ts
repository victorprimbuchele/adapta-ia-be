import {
  LearningProfileNotFoundError,
  StudentNotFoundError,
} from "../domain/errors.js";
import type { StudentLearningProfileLink } from "../domain/learning-profile.js";
import type { LearningProfileRepository } from "../ports/learning-profile-repository.js";
import type { StudentRepository } from "../ports/student-repository.js";
import type { UserLearningProfileRepository } from "../ports/user-learning-profile-repository.js";

export interface AssignLearningProfileInput {
  studentId: string;
  learningProfileId: string;
}

/**
 * Vincula um único `LearningProfile` (simples ou composto) ao aluno via
 * `UserLearningProfile` (ver Épico 3, BE-E3.2). Se o aluno já tiver um
 * perfil, o novo substitui o anterior — dificuldades combinadas usam um
 * perfil composto do catálogo, nunca múltiplos vínculos simultâneos.
 */
export class AssignLearningProfile {
  constructor(
    private readonly studentRepository: StudentRepository,
    private readonly learningProfileRepository: LearningProfileRepository,
    private readonly userLearningProfileRepository: UserLearningProfileRepository,
  ) {}

  async execute(
    input: AssignLearningProfileInput,
  ): Promise<StudentLearningProfileLink> {
    const student = await this.studentRepository.findById(input.studentId);
    if (!student) {
      throw new StudentNotFoundError(input.studentId);
    }

    const learningProfile = await this.learningProfileRepository.findById(
      input.learningProfileId,
    );
    if (!learningProfile) {
      throw new LearningProfileNotFoundError(input.learningProfileId);
    }

    await this.userLearningProfileRepository.replaceForUser(
      student.id,
      learningProfile.id,
    );

    return {
      studentId: student.id,
      learningProfileId: learningProfile.id,
      learningProfile,
    };
  }
}
