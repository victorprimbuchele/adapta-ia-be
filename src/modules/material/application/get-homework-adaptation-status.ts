import { ZodError } from "zod";

import { parseLearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";
import type { LearningProfileRepository } from "../../escola/ports/learning-profile-repository.js";
import type { AdaptationStatus } from "../domain/adaptation-status.js";
import { HomeworkNotGeneratorError } from "../domain/errors.js";
import type { AdaptationJobStatusPort } from "../ports/adaptation-job-status.js";
import type { HomeworkRepository } from "../ports/homework-repository.js";
import { authorizeHomeworkOwner } from "./authorize-homework-owner.js";
import {
  aggregateAdaptationStatus,
  resolveAdaptationStatus,
} from "./resolve-adaptation-status.js";

export interface ProfileAdaptationStatusItem {
  learningProfileId: string;
  status: AdaptationStatus;
  /** Presente somente quando `status === "concluido"`. */
  variantId?: string;
  failedReason?: string;
}

export interface HomeworkAdaptationStatusResult {
  homeworkId: string;
  status: AdaptationStatus;
  adaptations: ProfileAdaptationStatusItem[];
}

/**
 * Polling do andamento das adaptações de uma geradora (Épico 5, BE-E5.9).
 * Combina estado do job na fila com completude da variante no banco.
 */
export class GetHomeworkAdaptationStatus {
  constructor(
    private readonly homeworkRepository: HomeworkRepository,
    private readonly learningProfileRepository: LearningProfileRepository,
    private readonly adaptationJobStatus: AdaptationJobStatusPort,
  ) {}

  async execute(
    homeworkId: string,
    teacherId: string,
  ): Promise<HomeworkAdaptationStatusResult> {
    const homework = await authorizeHomeworkOwner(
      this.homeworkRepository,
      homeworkId,
      teacherId,
    );

    if (homework.homeworkId !== null) {
      throw new HomeworkNotGeneratorError(homeworkId);
    }

    const [variants, jobSnapshots] = await Promise.all([
      this.homeworkRepository.findAdaptationsByHomeworkId(homework.id),
      this.adaptationJobStatus.listByHomeworkId(homework.id),
    ]);

    const variantsByProfile = new Map(
      variants
        .filter((variant) => variant.learningProfileId !== null)
        .map((variant) => [variant.learningProfileId!, variant]),
    );

    const jobsByProfile = new Map(
      jobSnapshots.map((snapshot) => [snapshot.learningProfileId, snapshot]),
    );

    const learningProfileIds = [
      ...new Set([
        ...variantsByProfile.keys(),
        ...jobsByProfile.keys(),
      ]),
    ].sort();

    const adaptations: ProfileAdaptationStatusItem[] = [];

    for (const learningProfileId of learningProfileIds) {
      const variant = variantsByProfile.get(learningProfileId) ?? null;
      const job = jobsByProfile.get(learningProfileId);
      const learningProfile =
        await this.learningProfileRepository.findById(learningProfileId);

      let profilePrompt = null;
      if (learningProfile) {
        try {
          profilePrompt = parseLearningProfilePrompt(learningProfile.prompt);
        } catch (error) {
          if (!(error instanceof ZodError)) {
            throw error;
          }
        }
      }

      const status = resolveAdaptationStatus({
        jobState: job?.state ?? null,
        variant,
        profilePrompt,
      });

      const item: ProfileAdaptationStatusItem = {
        learningProfileId,
        status,
      };

      if (status === "concluido" && variant) {
        item.variantId = variant.id;
      }

      if (status === "erro" && job?.failedReason) {
        item.failedReason = job.failedReason;
      }

      adaptations.push(item);
    }

    return {
      homeworkId: homework.id,
      status: aggregateAdaptationStatus(
        adaptations.map((item) => item.status),
      ),
      adaptations,
    };
  }
}
