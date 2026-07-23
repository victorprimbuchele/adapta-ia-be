import { persistVariantPdf } from "./persist-variant-pdf.js";
import { PdfKitVariantPdfGenerator } from "../adapters/pdf/pdfkit-variant-pdf-generator.js";
import { InMemoryFileRepository } from "./test-utils/in-memory-file-repository.js";
import { InMemoryHomeworkRepository } from "./test-utils/in-memory-homework-repository.js";
import { InMemoryObjectStorage } from "./test-utils/in-memory-object-storage.js";

describe("persistVariantPdf", () => {
  it("faz upload, cria File tipo pdf e vincula contentFileId na variante", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const fileRepository = new InMemoryFileRepository();
    const objectStorage = new InMemoryObjectStorage();
    const pdfGenerator = new PdfKitVariantPdfGenerator();

    const generator = await homeworkRepository.createGenerator({
      title: "Geradora",
      content: "Conteúdo",
      classId: "class-1",
      teacherId: "teacher-1",
    });
    const variant = await homeworkRepository.upsertAdaptation({
      title: "Variante",
      content: "Texto adaptado",
      glossary: [{ term: "termo", definition: "definição" }],
      homeworkId: generator.id,
      learningProfileId: "profile-1",
      classId: "class-1",
      teacherId: "teacher-1",
    });

    const pdf = await pdfGenerator.generate({
      title: variant.title,
      content: variant.content,
      glossary: variant.glossary,
      profilePrompt: {
        code: "P1",
        kind: "base",
        combines: ["P1"],
        instructions: "instruções",
        adaptations: {
          simplifyText: true,
          glossary: true,
          tts: false,
          microtasks: false,
          visualStructure: false,
          highContrast: false,
          largeFont: false,
          screenReader: false,
        },
      },
    });

    const updated = await persistVariantPdf({
      objectStorage,
      fileRepository,
      homeworkRepository,
      variant,
      pdf,
    });

    expect(updated.contentFileId).not.toBeNull();
    expect(objectStorage.calls[0]?.key).toBe(
      `homeworks/${variant.id}/content.pdf`,
    );

    const file = await fileRepository.findById(updated.contentFileId!);
    expect(file).toMatchObject({
      type: "pdf",
      path: `homeworks/${variant.id}/content.pdf`,
      mimeType: "application/pdf",
      sizeBytes: pdf.data.length,
    });
  });
});
