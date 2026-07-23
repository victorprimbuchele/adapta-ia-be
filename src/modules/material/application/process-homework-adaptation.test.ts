import { LearningProfileNotFoundError } from "../../escola/domain/errors.js";
import type { LearningProfile } from "../../escola/domain/learning-profile.js";
import { InMemoryLearningProfileRepository } from "../../escola/application/test-utils/in-memory-learning-profile-repository.js";
import {
  HomeworkAccessDeniedError,
  HomeworkNotFoundError,
  HomeworkNotGeneratorError,
  InvalidLearningProfilePromptError,
} from "../domain/errors.js";
import { buildVariantSpeechText } from "./build-variant-speech-text.js";
import { ProcessHomeworkAdaptation } from "./process-homework-adaptation.js";
import { PdfKitVariantPdfGenerator } from "../adapters/pdf/pdfkit-variant-pdf-generator.js";
import { InMemoryAudioGenerator } from "./test-utils/in-memory-audio-generator.js";
import { InMemoryFileRepository } from "./test-utils/in-memory-file-repository.js";
import { InMemoryHomeworkRepository } from "./test-utils/in-memory-homework-repository.js";
import { InMemoryObjectStorage } from "./test-utils/in-memory-object-storage.js";
import { InMemoryTextSimplifier } from "./test-utils/in-memory-text-simplifier.js";

const PROFILE_P1: LearningProfile = {
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
    instructions:
      "Reescreva a homework em linguagem simples e clara, adequada a " +
      "estudantes com dificuldades de leitura.",
  },
};

const PROFILE_P2: LearningProfile = {
  id: "profile-2",
  name: "Microtarefas + estrutura visual",
  prompt: {
    code: "P2",
    kind: "base",
    combines: ["P2"],
    adaptations: {
      simplifyText: false,
      glossary: false,
      tts: false,
      microtasks: true,
      visualStructure: true,
      highContrast: false,
      largeFont: false,
      screenReader: false,
    },
    instructions: "Fragmente em microtarefas.",
  },
};

async function buildScenario(overrides?: { profile?: LearningProfile }) {
  const profile = overrides?.profile ?? PROFILE_P1;
  const homeworkRepository = new InMemoryHomeworkRepository();
  const learningProfileRepository = new InMemoryLearningProfileRepository([
    PROFILE_P1,
    PROFILE_P2,
    profile,
  ]);
  const textSimplifier = new InMemoryTextSimplifier();
  const audioGenerator = new InMemoryAudioGenerator();
  const pdfGenerator = new PdfKitVariantPdfGenerator();
  const objectStorage = new InMemoryObjectStorage();
  const fileRepository = new InMemoryFileRepository();
  const processHomeworkAdaptation = new ProcessHomeworkAdaptation(
    homeworkRepository,
    learningProfileRepository,
    textSimplifier,
    audioGenerator,
    pdfGenerator,
    objectStorage,
    fileRepository,
  );

  const generator = await homeworkRepository.createGenerator({
    title: "Frações equivalentes",
    content: "Explique o conceito de frações equivalentes com exemplos.",
    classId: "class-1",
    teacherId: "teacher-1",
  });

  return {
    generator,
    homeworkRepository,
    textSimplifier,
    audioGenerator,
    objectStorage,
    fileRepository,
    processHomeworkAdaptation,
  };
}

describe("ProcessHomeworkAdaptation", () => {
  it("persiste variante vinculada à geradora e ao perfil com glossário (BE-E5.5)", async () => {
    const {
      generator,
      homeworkRepository,
      textSimplifier,
      processHomeworkAdaptation,
    } = await buildScenario();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const { homework: variant } = await processHomeworkAdaptation.execute({
      homeworkId: generator.id,
      learningProfileId: PROFILE_P1.id,
      teacherId: "teacher-1",
    });

    expect(textSimplifier.calls).toHaveLength(1);
    expect(variant).toMatchObject({
      title: textSimplifier.result.title,
      content: textSimplifier.result.content,
      glossary: textSimplifier.result.glossary,
      homeworkId: generator.id,
      learningProfileId: PROFILE_P1.id,
      classId: "class-1",
      teacherId: "teacher-1",
      isDraft: false,
    });
    expect(variant.homeworkId).not.toBeNull();
    expect(variant.learningProfileId).not.toBeNull();
    expect(homeworkRepository.homeworks).toHaveLength(2);
    expect(
      homeworkRepository.homeworks.find((item) => item.id === variant.id)
        ?.glossary,
    ).toEqual([
      { term: "conceito", definition: "ideia principal do conteúdo" },
    ]);
    await expect(
      homeworkRepository.findAdaptationsByHomeworkId(generator.id),
    ).resolves.toEqual([expect.objectContaining({ id: variant.id })]);

    logSpy.mockRestore();
  });

  it("gera áudio TTS a partir do texto da variante quando o perfil pede (BE-E5.6)", async () => {
    const {
      generator,
      textSimplifier,
      audioGenerator,
      processHomeworkAdaptation,
    } = await buildScenario();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const { homework: variant, audio } =
      await processHomeworkAdaptation.execute({
        homeworkId: generator.id,
        learningProfileId: PROFILE_P1.id,
        teacherId: "teacher-1",
      });

    expect(audio).toEqual(audioGenerator.result);
    expect(audioGenerator.calls).toEqual([
      {
        text: buildVariantSpeechText({
          title: textSimplifier.result.title,
          content: textSimplifier.result.content,
        }),
      },
    ]);
    expect(audioGenerator.calls[0]?.text).toContain(variant.title);
    expect(audioGenerator.calls[0]?.text).toContain(variant.content);

    logSpy.mockRestore();
  });

  it("faz upload do áudio e vincula audioFileId a File tipo audio (BE-E5.7)", async () => {
    const {
      generator,
      audioGenerator,
      objectStorage,
      fileRepository,
      processHomeworkAdaptation,
    } = await buildScenario();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const { homework: variant } = await processHomeworkAdaptation.execute({
      homeworkId: generator.id,
      learningProfileId: PROFILE_P1.id,
      teacherId: "teacher-1",
    });

    expect(variant.audioFileId).not.toBeNull();
    expect(objectStorage.calls).toHaveLength(2);
    expect(objectStorage.calls[0]).toMatchObject({
      key: `homeworks/${variant.id}/audio.mp3`,
      data: audioGenerator.result.data,
      mimeType: "audio/mpeg",
    });
    expect(objectStorage.calls[1]).toMatchObject({
      key: `homeworks/${variant.id}/content.pdf`,
      mimeType: "application/pdf",
    });

    const file = await fileRepository.findById(variant.audioFileId!);
    expect(file).toMatchObject({
      id: variant.audioFileId,
      type: "audio",
      path: `homeworks/${variant.id}/audio.mp3`,
      mimeType: "audio/mpeg",
      sizeBytes: audioGenerator.result.data.length,
    });

    logSpy.mockRestore();
  });

  it("não chama TTS quando o perfil não pede áudio, mas gera PDF (BE-E6.2)", async () => {
    const {
      generator,
      audioGenerator,
      objectStorage,
      fileRepository,
      processHomeworkAdaptation,
    } = await buildScenario({ profile: PROFILE_P2 });
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const { homework: variant, audio, pdf } =
      await processHomeworkAdaptation.execute({
        homeworkId: generator.id,
        learningProfileId: PROFILE_P2.id,
        teacherId: "teacher-1",
      });

    expect(audio).toBeNull();
    expect(variant.audioFileId).toBeNull();
    expect(audioGenerator.calls).toHaveLength(0);
    expect(variant.contentFileId).not.toBeNull();
    expect(pdf.mimeType).toBe("application/pdf");
    expect(objectStorage.calls).toHaveLength(1);
    expect(objectStorage.calls[0]?.key).toMatch(/content\.pdf$/);
    expect(fileRepository.files).toHaveLength(1);
    expect(fileRepository.files[0]?.type).toBe("pdf");

    logSpy.mockRestore();
  });

  it("faz upload do PDF e vincula contentFileId a File tipo pdf (BE-E6.2)", async () => {
    const {
      generator,
      objectStorage,
      fileRepository,
      processHomeworkAdaptation,
    } = await buildScenario();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const { homework: variant, pdf } = await processHomeworkAdaptation.execute({
      homeworkId: generator.id,
      learningProfileId: PROFILE_P1.id,
      teacherId: "teacher-1",
    });

    expect(variant.contentFileId).not.toBeNull();
    expect(objectStorage.calls.some((call) => call.key.endsWith("content.pdf"))).toBe(
      true,
    );

    const file = await fileRepository.findById(variant.contentFileId!);
    expect(file).toMatchObject({
      id: variant.contentFileId,
      type: "pdf",
      mimeType: "application/pdf",
      sizeBytes: pdf.data.length,
    });

    logSpy.mockRestore();
  });

  it("atualiza a mesma variante no reprocessamento do par geradora+perfil", async () => {
    const {
      generator,
      homeworkRepository,
      textSimplifier,
      processHomeworkAdaptation,
    } = await buildScenario();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const { homework: first } = await processHomeworkAdaptation.execute({
      homeworkId: generator.id,
      learningProfileId: PROFILE_P1.id,
      teacherId: "teacher-1",
    });

    textSimplifier.result = {
      title: "Título reprocessado",
      content: "Conteúdo reprocessado",
      glossary: [{ term: "novo", definition: "termo atualizado" }],
    };

    const { homework: second } = await processHomeworkAdaptation.execute({
      homeworkId: generator.id,
      learningProfileId: PROFILE_P1.id,
      teacherId: "teacher-1",
    });

    expect(second.id).toBe(first.id);
    expect(second).toMatchObject({
      title: "Título reprocessado",
      content: "Conteúdo reprocessado",
      glossary: [{ term: "novo", definition: "termo atualizado" }],
      homeworkId: generator.id,
      learningProfileId: PROFILE_P1.id,
    });
    expect(second.audioFileId).not.toBeNull();
    expect(homeworkRepository.homeworks).toHaveLength(2);
    await expect(
      homeworkRepository.findAdaptationsByHomeworkId(generator.id),
    ).resolves.toHaveLength(1);

    logSpy.mockRestore();
  });

  it("persiste uma variante por perfil vinculada à mesma geradora", async () => {
    const {
      generator,
      homeworkRepository,
      processHomeworkAdaptation,
    } = await buildScenario();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const { homework: variantP1 } = await processHomeworkAdaptation.execute({
      homeworkId: generator.id,
      learningProfileId: PROFILE_P1.id,
      teacherId: "teacher-1",
    });
    const { homework: variantP2 } = await processHomeworkAdaptation.execute({
      homeworkId: generator.id,
      learningProfileId: PROFILE_P2.id,
      teacherId: "teacher-1",
    });

    expect(variantP1.id).not.toBe(variantP2.id);
    expect(variantP1.homeworkId).toBe(generator.id);
    expect(variantP2.homeworkId).toBe(generator.id);
    expect(variantP1.learningProfileId).toBe(PROFILE_P1.id);
    expect(variantP2.learningProfileId).toBe(PROFILE_P2.id);
    expect(homeworkRepository.homeworks).toHaveLength(3);
    await expect(
      homeworkRepository.findAdaptationsByHomeworkId(generator.id),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: variantP1.id }),
        expect.objectContaining({ id: variantP2.id }),
      ]),
    );

    logSpy.mockRestore();
  });

  it("persiste glossary null quando o perfil não pede glossário", async () => {
    const {
      generator,
      homeworkRepository,
      textSimplifier,
      processHomeworkAdaptation,
    } = await buildScenario({ profile: PROFILE_P2 });
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const { homework: variant } = await processHomeworkAdaptation.execute({
      homeworkId: generator.id,
      learningProfileId: PROFILE_P2.id,
      teacherId: "teacher-1",
    });

    expect(variant.glossary).toBeNull();
    expect(
      homeworkRepository.homeworks.find((item) => item.id === variant.id)
        ?.glossary,
    ).toBeNull();
    expect(textSimplifier.calls).toHaveLength(1);

    logSpy.mockRestore();
  });

  it("rejeita homework inexistente", async () => {
    const {
      processHomeworkAdaptation,
      textSimplifier,
      audioGenerator,
      objectStorage,
    } = await buildScenario();

    await expect(
      processHomeworkAdaptation.execute({
        homeworkId: "inexistente",
        learningProfileId: PROFILE_P1.id,
        teacherId: "teacher-1",
      }),
    ).rejects.toBeInstanceOf(HomeworkNotFoundError);
    expect(textSimplifier.calls).toHaveLength(0);
    expect(audioGenerator.calls).toHaveLength(0);
    expect(objectStorage.calls).toHaveLength(0);
  });

  it("nega acesso quando a homework é de outro professor", async () => {
    const {
      generator,
      processHomeworkAdaptation,
      textSimplifier,
      audioGenerator,
    } = await buildScenario();

    await expect(
      processHomeworkAdaptation.execute({
        homeworkId: generator.id,
        learningProfileId: PROFILE_P1.id,
        teacherId: "teacher-2",
      }),
    ).rejects.toBeInstanceOf(HomeworkAccessDeniedError);
    expect(textSimplifier.calls).toHaveLength(0);
    expect(audioGenerator.calls).toHaveLength(0);
  });

  it("rejeita quando a homework não é geradora", async () => {
    const {
      generator,
      homeworkRepository,
      processHomeworkAdaptation,
      textSimplifier,
      audioGenerator,
    } = await buildScenario();

    const now = new Date();
    homeworkRepository.homeworks.push({
      id: "adaptation-1",
      title: "Variante",
      content: "Já adaptada",
      glossary: null,
      isDraft: false,
      homeworkId: generator.id,
      learningProfileId: PROFILE_P1.id,
      audioFileId: null,
      contentFileId: null,
      classId: "class-1",
      teacherId: "teacher-1",
      createdAt: now,
      updatedAt: now,
    });

    await expect(
      processHomeworkAdaptation.execute({
        homeworkId: "adaptation-1",
        learningProfileId: PROFILE_P1.id,
        teacherId: "teacher-1",
      }),
    ).rejects.toBeInstanceOf(HomeworkNotGeneratorError);
    expect(textSimplifier.calls).toHaveLength(0);
    expect(audioGenerator.calls).toHaveLength(0);
  });

  it("rejeita perfil inexistente", async () => {
    const {
      generator,
      processHomeworkAdaptation,
      textSimplifier,
      audioGenerator,
    } = await buildScenario();

    await expect(
      processHomeworkAdaptation.execute({
        homeworkId: generator.id,
        learningProfileId: "perfil-inexistente",
        teacherId: "teacher-1",
      }),
    ).rejects.toBeInstanceOf(LearningProfileNotFoundError);
    expect(textSimplifier.calls).toHaveLength(0);
    expect(audioGenerator.calls).toHaveLength(0);
  });

  it("rejeita prompt de perfil inválido", async () => {
    const {
      generator,
      processHomeworkAdaptation,
      textSimplifier,
      audioGenerator,
    } = await buildScenario({
      profile: {
        id: "profile-bad",
        name: "Perfil quebrado",
        prompt: { code: "X" },
      },
    });

    await expect(
      processHomeworkAdaptation.execute({
        homeworkId: generator.id,
        learningProfileId: "profile-bad",
        teacherId: "teacher-1",
      }),
    ).rejects.toBeInstanceOf(InvalidLearningProfilePromptError);
    expect(textSimplifier.calls).toHaveLength(0);
    expect(audioGenerator.calls).toHaveLength(0);
  });
});
