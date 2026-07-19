import { ZodError } from "zod";

import { LearningProfileNotFoundError } from "../../escola/domain/errors.js";
import { parseLearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";
import type { LearningProfileRepository } from "../../escola/ports/learning-profile-repository.js";
import {
  HomeworkNotGeneratorError,
  InvalidLearningProfilePromptError,
} from "../domain/errors.js";
import type { HomeworkAdaptationJob } from "../ports/adaptation-queue.js";
import type { HomeworkRepository } from "../ports/homework-repository.js";
import type {
  TextSimplifierPort,
  TextSimplifierResult,
} from "../ports/text-simplifier.js";
import { authorizeHomeworkOwner } from "./authorize-homework-owner.js";

/**
 * Consome um job de adaptação (Épico 5, BE-E5.2 / BE-E5.3 / ADR 006).
 * Carrega geradora + perfil, chama a LLM com o prompt do perfil e o
 * conteúdo estruturado. Persistência da variante fica para o próximo ticket.
 */
export class ProcessHomeworkAdaptation {
  constructor(
    private readonly homeworkRepository: HomeworkRepository,
    private readonly learningProfileRepository: LearningProfileRepository,
    private readonly textSimplifier: TextSimplifierPort,
  ) {}

  async execute(job: HomeworkAdaptationJob): Promise<TextSimplifierResult> {
    const homework = await authorizeHomeworkOwner(
      this.homeworkRepository,
      job.homeworkId,
      job.teacherId,
    );

    if (homework.homeworkId !== null) {
      throw new HomeworkNotGeneratorError(job.homeworkId);
    }

    const learningProfile = await this.learningProfileRepository.findById(
      job.learningProfileId,
    );
    if (!learningProfile) {
      throw new LearningProfileNotFoundError(job.learningProfileId);
    }

    let profilePrompt;
    try {
      profilePrompt = parseLearningProfilePrompt(learningProfile.prompt);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new InvalidLearningProfilePromptError(job.learningProfileId);
      }
      throw error;
    }

    const adapted = await this.textSimplifier.simplify({
      profilePrompt,
      homework: {
        title: homework.title,
        content: homework.content,
      },
    });

    console.log(
      `[adaptation] llm ok homework=${job.homeworkId} ` +
        `profile=${job.learningProfileId} code=${profilePrompt.code} ` +
        `title="${adapted.title}"`,
    );

    return adapted;
  }
}
