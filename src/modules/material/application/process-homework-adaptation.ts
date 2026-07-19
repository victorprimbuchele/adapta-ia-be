import { ZodError } from "zod";

import { LearningProfileNotFoundError } from "../../escola/domain/errors.js";
import { parseLearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";
import type { LearningProfileRepository } from "../../escola/ports/learning-profile-repository.js";
import {
  HomeworkNotGeneratorError,
  InvalidLearningProfilePromptError,
} from "../domain/errors.js";
import type { Homework } from "../domain/homework.js";
import type { HomeworkAdaptationJob } from "../ports/adaptation-queue.js";
import type {
  AudioGeneratorPort,
  GeneratedAudio,
} from "../ports/audio-generator.js";
import type { HomeworkRepository } from "../ports/homework-repository.js";
import type { TextSimplifierPort } from "../ports/text-simplifier.js";
import { authorizeHomeworkOwner } from "./authorize-homework-owner.js";
import { buildVariantSpeechText } from "./build-variant-speech-text.js";
import { resolveAdaptationGlossary } from "./resolve-adaptation-glossary.js";

export interface ProcessHomeworkAdaptationResult {
  homework: Homework;
  /** Áudio TTS da variante quando o perfil pede (BE-E5.6); upload em BE-E5.7. */
  audio: GeneratedAudio | null;
}

/**
 * Consome um job de adaptação (Épico 5, BE-E5.2–E5.6 / ADR 006).
 * Chama a LLM, resolve o glossário, persiste a Homework variante e gera
 * áudio TTS a partir do texto da variante quando o perfil pede.
 */
export class ProcessHomeworkAdaptation {
  constructor(
    private readonly homeworkRepository: HomeworkRepository,
    private readonly learningProfileRepository: LearningProfileRepository,
    private readonly textSimplifier: TextSimplifierPort,
    private readonly audioGenerator: AudioGeneratorPort,
  ) {}

  async execute(
    job: HomeworkAdaptationJob,
  ): Promise<ProcessHomeworkAdaptationResult> {
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

    const glossary = resolveAdaptationGlossary(
      profilePrompt,
      adapted.glossary,
    );

    const variant = await this.homeworkRepository.upsertAdaptation({
      title: adapted.title,
      content: adapted.content,
      glossary,
      homeworkId: homework.id,
      learningProfileId: job.learningProfileId,
      classId: homework.classId,
      teacherId: job.teacherId,
    });

    const audio = profilePrompt.adaptations.tts
      ? await this.audioGenerator.generate({
          text: buildVariantSpeechText(variant),
        })
      : null;

    console.log(
      `[adaptation] saved variant=${variant.id} homework=${job.homeworkId} ` +
        `profile=${job.learningProfileId} code=${profilePrompt.code} ` +
        `glossaryEntries=${glossary?.length ?? 0} ` +
        `audioBytes=${audio?.data.length ?? 0}`,
    );

    return { homework: variant, audio };
  }
}
