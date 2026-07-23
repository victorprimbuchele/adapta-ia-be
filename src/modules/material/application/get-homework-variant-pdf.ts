import type { Homework } from "../domain/homework.js";
import {
  HomeworkPdfNotFoundError,
  HomeworkVariantNotFoundError,
  LearningProfileIdRequiredError,
} from "../domain/errors.js";
import type { GetFile, GetFileResult } from "./get-file.js";
import { authorizeHomeworkOwner } from "./authorize-homework-owner.js";
import type { HomeworkRepository } from "../ports/homework-repository.js";

export interface GetHomeworkVariantPdfInput {
  homeworkId: string;
  teacherId: string;
  learningProfileId?: string;
}

export interface GetHomeworkVariantPdfResult extends GetFileResult {
  filename: string;
}

function buildPdfFilename(title: string): string {
  const sanitized = title
    .trim()
    .replace(/[^\w\s\-à-úÀ-Ú]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

  return `${sanitized || "atividade-adaptada"}.pdf`;
}

async function resolveVariant(
  homeworkRepository: HomeworkRepository,
  homework: Homework,
  learningProfileId?: string,
): Promise<Homework> {
  if (homework.homeworkId !== null) {
    return homework;
  }

  if (!learningProfileId) {
    throw new LearningProfileIdRequiredError();
  }

  const adaptations =
    await homeworkRepository.findAdaptationsByHomeworkId(homework.id);
  const variant = adaptations.find(
    (item) => item.learningProfileId === learningProfileId,
  );

  if (!variant) {
    throw new HomeworkVariantNotFoundError(homework.id, learningProfileId);
  }

  return variant;
}

/**
 * Download/preview do PDF adaptado (Épico 6, BE-E6.3).
 * Apenas o professor responsável (`teacherId`) pode acessar.
 */
export class GetHomeworkVariantPdf {
  constructor(
    private readonly homeworkRepository: HomeworkRepository,
    private readonly getFile: GetFile,
  ) {}

  async execute(
    input: GetHomeworkVariantPdfInput,
  ): Promise<GetHomeworkVariantPdfResult> {
    const homework = await authorizeHomeworkOwner(
      this.homeworkRepository,
      input.homeworkId,
      input.teacherId,
    );

    const variant = await resolveVariant(
      this.homeworkRepository,
      homework,
      input.learningProfileId,
    );

    if (variant.contentFileId === null) {
      throw new HomeworkPdfNotFoundError(variant.id);
    }

    const fileResult = await this.getFile.execute(variant.contentFileId);

    return {
      ...fileResult,
      filename: buildPdfFilename(variant.title),
    };
  }
}
