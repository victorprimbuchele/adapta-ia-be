import type { IdempotencyPort } from "../../../shared/ports/idempotency.js";
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
import {
  adaptationIdempotencyKey,
  adaptationIdempotencyTtlSeconds,
} from "./adaptation-idempotency-key.js";
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
  /** Perfis ignorados por idempotência Redis (já enfileirados/processados). */
  skippedLearningProfileIds: string[];
}

/**
 * Enfileira a adaptação de uma homework geradora para cada perfil alvo
 * (Épico 5, BE-E5.1 / BE-E5.2 / BE-E5.8 / ADR 005–006).
 * Usa Redis para não enfileirar de novo o mesmo par atividade+perfil.
 */
export class EnqueueHomeworkAdaptation {
  constructor(
    private readonly homeworkRepository: HomeworkRepository,
    private readonly userClassRepository: UserClassRepository,
    private readonly userLearningProfileRepository: UserLearningProfileRepository,
    private readonly learningProfileRepository: LearningProfileRepository,
    private readonly adaptationQueue: AdaptationQueue,
    private readonly idempotency: IdempotencyPort,
    private readonly idempotencyTtlSeconds: number = adaptationIdempotencyTtlSeconds(),
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

    const enqueuedLearningProfileIds: string[] = [];
    const skippedLearningProfileIds: string[] = [];

    for (const learningProfileId of learningProfileIds) {
      const acquired = await this.idempotency.acquire(
        adaptationIdempotencyKey(homework.id, learningProfileId),
        this.idempotencyTtlSeconds,
      );

      if (acquired) {
        enqueuedLearningProfileIds.push(learningProfileId);
      } else {
        skippedLearningProfileIds.push(learningProfileId);
      }
    }

    await this.adaptationQueue.enqueue(
      enqueuedLearningProfileIds.map((learningProfileId) => ({
        homeworkId: homework.id,
        learningProfileId,
        teacherId: input.teacherId,
      })),
    );

    return {
      homeworkId: homework.id,
      enqueuedLearningProfileIds,
      skippedLearningProfileIds,
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
