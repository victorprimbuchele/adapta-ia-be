import {
  HomeworkAccessDeniedError,
  HomeworkNotFoundError,
  HomeworkPdfNotFoundError,
  HomeworkVariantNotFoundError,
  LearningProfileIdRequiredError,
} from "../domain/errors.js";
import { GetHomeworkVariantPdf } from "./get-homework-variant-pdf.js";
import { GetFile } from "./get-file.js";
import { InMemoryFileRepository } from "./test-utils/in-memory-file-repository.js";
import { InMemoryHomeworkRepository } from "./test-utils/in-memory-homework-repository.js";
import { InMemoryObjectStorage } from "./test-utils/in-memory-object-storage.js";

describe("GetHomeworkVariantPdf", () => {
  async function buildScenario() {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const fileRepository = new InMemoryFileRepository();
    const objectStorage = new InMemoryObjectStorage();
    const getFile = new GetFile(fileRepository, objectStorage);
    const getHomeworkVariantPdf = new GetHomeworkVariantPdf(
      homeworkRepository,
      getFile,
    );

    const generator = await homeworkRepository.createGenerator({
      title: "Frações equivalentes",
      content: "Conteúdo da geradora",
      classId: "class-1",
      teacherId: "teacher-1",
    });

    const variant = await homeworkRepository.upsertAdaptation({
      title: "Frações — perfil P1",
      content: "Texto adaptado",
      glossary: [{ term: "fração", definition: "parte de um todo" }],
      homeworkId: generator.id,
      learningProfileId: "profile-1",
      classId: "class-1",
      teacherId: "teacher-1",
    });

    const pdfData = Buffer.from("%PDF-1.4 fake");
    await objectStorage.store({
      key: "homeworks/variant/content.pdf",
      data: pdfData,
      mimeType: "application/pdf",
    });
    const pdfFile = await fileRepository.create({
      type: "pdf",
      path: "homeworks/variant/content.pdf",
      mimeType: "application/pdf",
      sizeBytes: pdfData.length,
    });
    await homeworkRepository.attachContentFile(variant.id, pdfFile.id);

    return {
      homeworkRepository,
      getHomeworkVariantPdf,
      generator,
      variant: (await homeworkRepository.findById(variant.id))!,
      pdfFile,
      pdfData,
    };
  }

  it("professor da turma baixa o PDF pelo id da variante", async () => {
    const { getHomeworkVariantPdf, variant, pdfFile, pdfData } =
      await buildScenario();

    const result = await getHomeworkVariantPdf.execute({
      homeworkId: variant.id,
      teacherId: "teacher-1",
    });

    expect(result.file).toEqual(pdfFile);
    expect(result.data).toEqual(pdfData);
    expect(result.filename).toBe("Frações-perfil-P1.pdf");
  });

  it("professor baixa o PDF da geradora informando learningProfileId", async () => {
    const { getHomeworkVariantPdf, generator, pdfData } = await buildScenario();

    const result = await getHomeworkVariantPdf.execute({
      homeworkId: generator.id,
      teacherId: "teacher-1",
      learningProfileId: "profile-1",
    });

    expect(result.data).toEqual(pdfData);
    expect(result.file.type).toBe("pdf");
  });

  it("nega acesso a professor de outra turma", async () => {
    const { getHomeworkVariantPdf, variant } = await buildScenario();

    await expect(
      getHomeworkVariantPdf.execute({
        homeworkId: variant.id,
        teacherId: "teacher-2",
      }),
    ).rejects.toBeInstanceOf(HomeworkAccessDeniedError);
  });

  it("nega acesso quando a geradora é de outro professor", async () => {
    const { getHomeworkVariantPdf, generator } = await buildScenario();

    await expect(
      getHomeworkVariantPdf.execute({
        homeworkId: generator.id,
        teacherId: "teacher-2",
        learningProfileId: "profile-1",
      }),
    ).rejects.toBeInstanceOf(HomeworkAccessDeniedError);
  });

  it("rejeita homework inexistente", async () => {
    const { getHomeworkVariantPdf } = await buildScenario();

    await expect(
      getHomeworkVariantPdf.execute({
        homeworkId: "inexistente",
        teacherId: "teacher-1",
      }),
    ).rejects.toBeInstanceOf(HomeworkNotFoundError);
  });

  it("exige learningProfileId quando o id é da geradora", async () => {
    const { getHomeworkVariantPdf, generator } = await buildScenario();

    await expect(
      getHomeworkVariantPdf.execute({
        homeworkId: generator.id,
        teacherId: "teacher-1",
      }),
    ).rejects.toBeInstanceOf(LearningProfileIdRequiredError);
  });

  it("rejeita quando não há variante para o perfil informado", async () => {
    const { getHomeworkVariantPdf, generator } = await buildScenario();

    await expect(
      getHomeworkVariantPdf.execute({
        homeworkId: generator.id,
        teacherId: "teacher-1",
        learningProfileId: "profile-inexistente",
      }),
    ).rejects.toBeInstanceOf(HomeworkVariantNotFoundError);
  });

  it("rejeita quando a variante ainda não tem PDF", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const getHomeworkVariantPdf = new GetHomeworkVariantPdf(
      homeworkRepository,
      new GetFile(new InMemoryFileRepository(), new InMemoryObjectStorage()),
    );

    const generator = await homeworkRepository.createGenerator({
      title: "Sem PDF",
      content: "Conteúdo",
      classId: "class-1",
      teacherId: "teacher-1",
    });
    const variant = await homeworkRepository.upsertAdaptation({
      title: "Variante sem PDF",
      content: "Texto",
      glossary: null,
      homeworkId: generator.id,
      learningProfileId: "profile-1",
      classId: "class-1",
      teacherId: "teacher-1",
    });

    await expect(
      getHomeworkVariantPdf.execute({
        homeworkId: variant.id,
        teacherId: "teacher-1",
      }),
    ).rejects.toBeInstanceOf(HomeworkPdfNotFoundError);
  });
});
