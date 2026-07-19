import { LearningProfileNotFoundError } from "../../escola/domain/errors.js";
import type { LearningProfileRepository } from "../../escola/ports/learning-profile-repository.js";
import type { UserClassRepository } from "../../escola/ports/user-class-repository.js";
import type { UserLearningProfileRepository } from "../../escola/ports/user-learning-profile-repository.js";
import {
  HomeworkNotGeneratorError,
  NoLearningProfilesToAdaptError,
} from "../domain/errors.js";
import type { AdaptationQueue } from "../ports/adaptation-queue.js";
import type { HomeworkRepository } from "../ports/homework-repository.js";
import { authorizeHomeworkOwner } from "./authorize-homework-owner.js";

export interface EnqueueHomeworkAdaptationInput {
  homeworkId: string;
  teacherId: string;
  /** When omitted/empty, uses distinct profiles present in the homework's class. */
  learningProfileIds?: string[];
}

export interface EnqueueHomeworkAdaptationResult {
  homeworkId: string;
  enqueuedLearningProfileIds: string[];
}

/**
 * Enfileira a adaptação de uma homework geradora para cada perfil alvo
 * (perfis da turma ou seleção explícita) e retorna sem aguardar o worker
 * (ver Épico 5, BE-E5.1 / ADR 006).
 */
export class EnqueueHomeworkAdaptation {
  constructor(
    private readonly homeworkRepository: HomeworkRepository,
    private readonly userClassRepository: UserClassRepository,
    private readonly userLearningProfileRepository: UserLearningProfileRepository,
    private readonly learningProfileRepository: LearningProfileRepository,
    private readonly adaptationQueue: AdaptationQueue,
  ) {}

  async execute(
    input: EnqueueHomeworkAdaptationInput,
  ): Promise<EnqueueHomeworkAdaptationResult> {
    const homework = await authorizeHomeworkOwner(
      this.homeworkRepository,
      input.homeworkId,
      input.teacherId,
    );

    if (homework.homeworkId !== null) {
      throw new HomeworkNotGeneratorError(input.homeworkId);
    }

    const learningProfileIds = await this.resolveLearningProfileIds(
      homework.classId,
      input.learningProfileIds,
    );

    if (learningProfileIds.length === 0) {
      throw new NoLearningProfilesToAdaptError(input.homeworkId);
    }

    await this.adaptationQueue.enqueue(
      learningProfileIds.map((learningProfileId) => ({
        homeworkId: homework.id,
        learningProfileId,
        teacherId: input.teacherId,
      })),
    );

    return {
      homeworkId: homework.id,
      enqueuedLearningProfileIds: learningProfileIds,
    };
  }

  private async resolveLearningProfileIds(
    classId: string,
    selectedIds: string[] | undefined,
  ): Promise<string[]> {
    if (selectedIds && selectedIds.length > 0) {
      const uniqueIds = [...new Set(selectedIds)];

      for (const learningProfileId of uniqueIds) {
        const profile =
          await this.learningProfileRepository.findById(learningProfileId);
        if (!profile) {
          throw new LearningProfileNotFoundError(learningProfileId);
        }
      }

      return uniqueIds;
    }

    const studentIds =
      await this.userClassRepository.listStudentIdsByClassId(classId);
    if (studentIds.length === 0) {
      return [];
    }

    const profilesByUserId =
      await this.userLearningProfileRepository.findLearningProfilesByUserIds(
        studentIds,
      );

    return [...new Set([...profilesByUserId.values()].map((profile) => profile.id))];
  }
}
