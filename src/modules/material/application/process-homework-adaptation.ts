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
import type { FileRepository } from "../ports/file-repository.js";
import type { HomeworkRepository } from "../ports/homework-repository.js";
import type { ObjectStoragePort } from "../ports/object-storage.js";
import type { GeneratedPdf, PdfGeneratorPort } from "../ports/pdf-generator.js";
import type { TextSimplifierPort } from "../ports/text-simplifier.js";
import { authorizeHomeworkOwner } from "./authorize-homework-owner.js";
import { buildVariantSpeechText } from "./build-variant-speech-text.js";
import { persistVariantAudio } from "./persist-variant-audio.js";
import { persistVariantPdf } from "./persist-variant-pdf.js";
import { resolveAdaptationGlossary } from "./resolve-adaptation-glossary.js";

export interface ProcessHomeworkAdaptationResult {
  homework: Homework;
  /** Áudio TTS gerado quando o perfil pede (BE-E5.6); já enviado ao storage em BE-E5.7. */
  audio: GeneratedAudio | null;
  /** PDF gerado a partir da variante (Épico 6, BE-E6.2). */
  pdf: GeneratedPdf;
}

/**
 * Consome um job de adaptação (Épico 5, BE-E5.2–E5.7 / ADR 006).
 * Chama a LLM, persiste a variante, gera TTS quando o perfil pede,
 * faz upload + registro `File` vinculado em `audioFileId` e gera o PDF
 * adaptado pós-processamento (Épico 6, BE-E6.2).
 */
export class ProcessHomeworkAdaptation {
  constructor(
    private readonly homeworkRepository: HomeworkRepository,
    private readonly learningProfileRepository: LearningProfileRepository,
    private readonly textSimplifier: TextSimplifierPort,
    private readonly audioGenerator: AudioGeneratorPort,
    private readonly pdfGenerator: PdfGeneratorPort,
    private readonly objectStorage: ObjectStoragePort,
    private readonly fileRepository: FileRepository,
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

    let variant = await this.homeworkRepository.upsertAdaptation({
      title: adapted.title,
      content: adapted.content,
      subject: homework.subject,
      question: homework.question,
      glossary,
      homeworkId: homework.id,
      learningProfileId: job.learningProfileId,
      classId: homework.classId,
      teacherId: job.teacherId,
    });

    let audio: GeneratedAudio | null = null;
    if (profilePrompt.adaptations.tts) {
      audio = await this.audioGenerator.generate({
        text: buildVariantSpeechText(variant),
      });
      variant = await persistVariantAudio({
        objectStorage: this.objectStorage,
        fileRepository: this.fileRepository,
        homeworkRepository: this.homeworkRepository,
        variant,
        audio,
      });
    }

    const pdf = await this.pdfGenerator.generate({
      title: variant.title,
      content: variant.content,
      question: variant.question,
      glossary: variant.glossary,
      profilePrompt,
    });
    variant = await persistVariantPdf({
      objectStorage: this.objectStorage,
      fileRepository: this.fileRepository,
      homeworkRepository: this.homeworkRepository,
      variant,
      pdf,
    });

    console.log(
      `[adaptation] saved variant=${variant.id} homework=${job.homeworkId} ` +
        `profile=${job.learningProfileId} code=${profilePrompt.code} ` +
        `glossaryEntries=${glossary?.length ?? 0} ` +
        `audioFileId=${variant.audioFileId ?? "none"} ` +
        `contentFileId=${variant.contentFileId ?? "none"} ` +
        `audioBytes=${audio?.data.length ?? 0} ` +
        `pdfBytes=${pdf.data.length}`,
    );

    return { homework: variant, audio, pdf };
  }
}
