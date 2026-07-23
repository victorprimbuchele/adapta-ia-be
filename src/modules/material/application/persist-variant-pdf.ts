import type { Homework } from "../domain/homework.js";
import type { FileRepository } from "../ports/file-repository.js";
import type { HomeworkRepository } from "../ports/homework-repository.js";
import type { ObjectStoragePort } from "../ports/object-storage.js";
import type { GeneratedPdf } from "../ports/pdf-generator.js";

/**
 * Faz upload do PDF, cria o registro `File` (`type = pdf`) e
 * vincula em `Homework.contentFileId` (Épico 6, BE-E6.2).
 */
export async function persistVariantPdf(deps: {
  objectStorage: ObjectStoragePort;
  fileRepository: FileRepository;
  homeworkRepository: HomeworkRepository;
  variant: Homework;
  pdf: GeneratedPdf;
}): Promise<Homework> {
  const key = `homeworks/${deps.variant.id}/content.pdf`;

  const stored = await deps.objectStorage.store({
    key,
    data: deps.pdf.data,
    mimeType: deps.pdf.mimeType,
  });

  const file = await deps.fileRepository.create({
    type: "pdf",
    path: stored.path,
    mimeType: deps.pdf.mimeType,
    sizeBytes: deps.pdf.data.length,
  });

  return deps.homeworkRepository.attachContentFile(deps.variant.id, file.id);
}
