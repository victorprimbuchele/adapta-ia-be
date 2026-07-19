import { persistVariantAudio } from "./persist-variant-audio.js";
import { InMemoryAudioGenerator } from "./test-utils/in-memory-audio-generator.js";
import { InMemoryFileRepository } from "./test-utils/in-memory-file-repository.js";
import { InMemoryHomeworkRepository } from "./test-utils/in-memory-homework-repository.js";
import { InMemoryObjectStorage } from "./test-utils/in-memory-object-storage.js";

describe("persistVariantAudio", () => {
  it("faz upload, cria File tipo audio e vincula audioFileId na variante", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const fileRepository = new InMemoryFileRepository();
    const objectStorage = new InMemoryObjectStorage();
    const audioGenerator = new InMemoryAudioGenerator();

    const generator = await homeworkRepository.createGenerator({
      title: "Geradora",
      content: "Conteúdo",
      classId: "class-1",
      teacherId: "teacher-1",
    });
    const variant = await homeworkRepository.upsertAdaptation({
      title: "Variante",
      content: "Texto adaptado",
      glossary: null,
      homeworkId: generator.id,
      learningProfileId: "profile-1",
      classId: "class-1",
      teacherId: "teacher-1",
    });

    const updated = await persistVariantAudio({
      objectStorage,
      fileRepository,
      homeworkRepository,
      variant,
      audio: audioGenerator.result,
    });

    expect(updated.audioFileId).not.toBeNull();
    expect(objectStorage.calls[0]?.key).toBe(
      `homeworks/${variant.id}/audio.mp3`,
    );

    const file = await fileRepository.findById(updated.audioFileId!);
    expect(file).toMatchObject({
      type: "audio",
      path: `homeworks/${variant.id}/audio.mp3`,
      mimeType: "audio/mpeg",
      sizeBytes: audioGenerator.result.data.length,
    });
  });
});
