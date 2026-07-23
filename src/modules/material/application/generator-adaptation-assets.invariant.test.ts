import type { LearningProfile } from "../../escola/domain/learning-profile.js";
import { InMemoryLearningProfileRepository } from "../../escola/application/test-utils/in-memory-learning-profile-repository.js";
import {
  generatorHasNoAdaptationAssets,
  hasAdaptationAssets,
  isGeneratorHomework,
} from "../domain/adaptation-assets.js";
import { GetHomeworkDetail } from "./get-homework-detail.js";
import { ProcessHomeworkAdaptation } from "./process-homework-adaptation.js";
import { UpdateDraftHomework } from "./update-draft-homework.js";
import { InMemoryAudioGenerator } from "./test-utils/in-memory-audio-generator.js";
import { InMemoryFileRepository } from "./test-utils/in-memory-file-repository.js";
import { InMemoryHomeworkRepository } from "./test-utils/in-memory-homework-repository.js";
import { InMemoryObjectStorage } from "./test-utils/in-memory-object-storage.js";
import { InMemoryTextSimplifier } from "./test-utils/in-memory-text-simplifier.js";
import { PdfKitVariantPdfGenerator } from "../adapters/pdf/pdfkit-variant-pdf-generator.js";

/**
 * BE-E5.11 — glossário e áudio só existem em variantes, nunca na geradora.
 */
describe("invariante: glossário/áudio só em variantes (BE-E5.11)", () => {
  const PROFILE: LearningProfile = {
    id: "profile-1",
    name: "Simplificado + glossário + TTS",
    prompt: {
      code: "P1",
      kind: "base",
      combines: ["P1"],
      adaptations: {
        simplifyText: true,
        glossary: true,
        tts: true,
        microtasks: false,
        visualStructure: false,
        highContrast: false,
        largeFont: false,
        screenReader: false,
      },
      instructions: "Simplifique com glossário e TTS.",
    },
  };

  async function buildAdaptedScenario() {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const learningProfileRepository = new InMemoryLearningProfileRepository([
      PROFILE,
    ]);
    const textSimplifier = new InMemoryTextSimplifier();
    const audioGenerator = new InMemoryAudioGenerator();
    const objectStorage = new InMemoryObjectStorage();
    const fileRepository = new InMemoryFileRepository();
    const processHomeworkAdaptation = new ProcessHomeworkAdaptation(
      homeworkRepository,
      learningProfileRepository,
      textSimplifier,
      audioGenerator,
      new PdfKitVariantPdfGenerator(),
      objectStorage,
      fileRepository,
    );

    const generator = await homeworkRepository.createGenerator({
      title: "Frações equivalentes",
      content: "Explique o conceito de frações equivalentes.",
      classId: "class-1",
      teacherId: "teacher-1",
    });

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const { homework: variant } = await processHomeworkAdaptation.execute({
      homeworkId: generator.id,
      learningProfileId: PROFILE.id,
      teacherId: "teacher-1",
    });
    logSpy.mockRestore();

    return { homeworkRepository, generator, variant };
  }

  it("geradora nasce sem glossário e sem áudio", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const generator = await homeworkRepository.createGenerator({
      title: "Atividade",
      content: "Conteúdo",
      classId: "class-1",
      teacherId: "teacher-1",
    });

    expect(isGeneratorHomework(generator)).toBe(true);
    expect(generatorHasNoAdaptationAssets(generator)).toBe(true);
    expect(generator.glossary).toBeNull();
    expect(generator.audioFileId).toBeNull();
  });

  it("editar rascunho da geradora não cria glossário nem áudio", async () => {
    const homeworkRepository = new InMemoryHomeworkRepository();
    const draft = await homeworkRepository.createGenerator({
      title: "Original",
      content: "Conteúdo",
      classId: "class-1",
      teacherId: "teacher-1",
    });
    const updateDraftHomework = new UpdateDraftHomework(homeworkRepository);

    const updated = await updateDraftHomework.execute({
      homeworkId: draft.id,
      teacherId: "teacher-1",
      title: "Atualizado",
      content: "Conteúdo atualizado",
    });

    expect(generatorHasNoAdaptationAssets(updated)).toBe(true);
    expect(updated.glossary).toBeNull();
    expect(updated.audioFileId).toBeNull();
  });

  it("após adaptação, glossário e áudio ficam só na variante", async () => {
    const { homeworkRepository, generator, variant } =
      await buildAdaptedScenario();

    const generatorAfter = await homeworkRepository.findById(generator.id);
    expect(generatorAfter).not.toBeNull();
    expect(generatorHasNoAdaptationAssets(generatorAfter!)).toBe(true);
    expect(generatorAfter!.glossary).toBeNull();
    expect(generatorAfter!.audioFileId).toBeNull();

    expect(isGeneratorHomework(variant)).toBe(false);
    expect(hasAdaptationAssets(variant)).toBe(true);
    expect(variant.glossary).toEqual([
      { term: "conceito", definition: "ideia principal do conteúdo" },
    ]);
    expect(variant.audioFileId).not.toBeNull();
  });

  it("detalhe da geradora expõe assets só nas adaptações", async () => {
    const { homeworkRepository, generator, variant } =
      await buildAdaptedScenario();
    const getHomeworkDetail = new GetHomeworkDetail(homeworkRepository);

    const detail = await getHomeworkDetail.execute(
      generator.id,
      "teacher-1",
    );

    expect(generatorHasNoAdaptationAssets(detail)).toBe(true);
    expect(detail.glossary).toBeNull();
    expect(detail.audioFileId).toBeNull();

    expect(detail.adaptations).toHaveLength(1);
    expect(detail.adaptations[0]).toMatchObject({
      id: variant.id,
      homeworkId: generator.id,
      glossary: [
        { term: "conceito", definition: "ideia principal do conteúdo" },
      ],
      audioFileId: variant.audioFileId,
    });
    expect(hasAdaptationAssets(detail.adaptations[0]!)).toBe(true);
  });
});
