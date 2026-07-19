import type { Homework } from "../domain/homework.js";
import type { GeneratedAudio } from "../ports/audio-generator.js";
import type { FileRepository } from "../ports/file-repository.js";
import type { HomeworkRepository } from "../ports/homework-repository.js";
import type { ObjectStoragePort } from "../ports/object-storage.js";

/**
 * Faz upload do áudio TTS, cria o registro `File` (`type = audio`) e
 * vincula em `Homework.audioFileId` (Épico 5, BE-E5.7).
 */
export async function persistVariantAudio(deps: {
  objectStorage: ObjectStoragePort;
  fileRepository: FileRepository;
  homeworkRepository: HomeworkRepository;
  variant: Homework;
  audio: GeneratedAudio;
}): Promise<Homework> {
  const key = `homeworks/${deps.variant.id}/audio.${deps.audio.format}`;

  const stored = await deps.objectStorage.store({
    key,
    data: deps.audio.data,
    mimeType: deps.audio.mimeType,
  });

  const file = await deps.fileRepository.create({
    type: "audio",
    path: stored.path,
    mimeType: deps.audio.mimeType,
    sizeBytes: deps.audio.data.length,
  });

  return deps.homeworkRepository.attachAudioFile(deps.variant.id, file.id);
}
