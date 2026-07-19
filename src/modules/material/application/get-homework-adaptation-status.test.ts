import type { LearningProfile } from "../../escola/domain/learning-profile.js";
import { InMemoryLearningProfileRepository } from "../../escola/application/test-utils/in-memory-learning-profile-repository.js";
import {
  HomeworkAccessDeniedError,
  HomeworkNotFoundError,
  HomeworkNotGeneratorError,
} from "../domain/errors.js";
import { GetHomeworkAdaptationStatus } from "./get-homework-adaptation-status.js";
import { InMemoryAdaptationJobStatus } from "./test-utils/in-memory-adaptation-job-status.js";
import { InMemoryHomeworkRepository } from "./test-utils/in-memory-homework-repository.js";

const PROFILE_TTS: LearningProfile = {
  id: "profile-tts",
  name: "Com TTS",
  prompt: {
    code: "P1",
    kind: "base",
    combines: ["P1"],
    adaptations: {
      simplifyText: true,
      glossary: false,
      tts: true,
      microtasks: false,
      visualStructure: false,
      highContrast: false,
      largeFont: false,
      screenReader: false,
    },
    instructions: "Simplifique com TTS.",
  },
};

const PROFILE_NO_TTS: LearningProfile = {
  id: "profile-no-tts",
  name: "Sem TTS",
  prompt: {
    code: "P2",
    kind: "base",
    combines: ["P2"],
    adaptations: {
      simplifyText: true,
      glossary: false,
      tts: false,
      microtasks: true,
      visualStructure: false,
      highContrast: false,
      largeFont: false,
      screenReader: false,
    },
    instructions: "Fragmente.",
  },
};

async function buildScenario() {
  const homeworkRepository = new InMemoryHomeworkRepository();
  const learningProfileRepository = new InMemoryLearningProfileRepository([
    PROFILE_TTS,
    PROFILE_NO_TTS,
  ]);
  const adaptationJobStatus = new InMemoryAdaptationJobStatus();
  const getHomeworkAdaptationStatus = new GetHomeworkAdaptationStatus(
    homeworkRepository,
    learningProfileRepository,
    adaptationJobStatus,
  );

  const generator = await homeworkRepository.createGenerator({
    title: "Frações",
    content: "Conteúdo original",
    classId: "class-1",
    teacherId: "teacher-1",
  });

  return {
    generator,
    homeworkRepository,
    adaptationJobStatus,
    getHomeworkAdaptationStatus,
  };
}

describe("GetHomeworkAdaptationStatus", () => {
  it("retorna pendente sem adaptações quando ainda não há jobs nem variantes", async () => {
    const { generator, getHomeworkAdaptationStatus } = await buildScenario();

    const result = await getHomeworkAdaptationStatus.execute(
      generator.id,
      "teacher-1",
    );

    expect(result).toEqual({
      homeworkId: generator.id,
      status: "pendente",
      adaptations: [],
    });
  });

  it("reflete job waiting/active/failed na fila", async () => {
    const {
      generator,
      adaptationJobStatus,
      getHomeworkAdaptationStatus,
    } = await buildScenario();

    adaptationJobStatus.snapshots.push(
      {
        learningProfileId: PROFILE_TTS.id,
        state: "waiting",
        attemptsMade: 0,
      },
      {
        learningProfileId: PROFILE_NO_TTS.id,
        state: "failed",
        attemptsMade: 3,
        failedReason: "Falha ao adaptar o texto com a IA. Tente novamente em instantes.",
      },
    );

    const result = await getHomeworkAdaptationStatus.execute(
      generator.id,
      "teacher-1",
    );

    expect(result.status).toBe("erro");
    expect(result.adaptations).toEqual([
      {
        learningProfileId: PROFILE_NO_TTS.id,
        status: "erro",
        failedReason:
          "Falha ao adaptar o texto com a IA. Tente novamente em instantes.",
      },
      {
        learningProfileId: PROFILE_TTS.id,
        status: "pendente",
      },
    ]);
  });

  it("durante retry com backoff permanece processando (não marca erro)", async () => {
    const {
      generator,
      adaptationJobStatus,
      getHomeworkAdaptationStatus,
    } = await buildScenario();

    adaptationJobStatus.snapshots.push({
      learningProfileId: PROFILE_TTS.id,
      state: "waiting",
      attemptsMade: 1,
    });

    const result = await getHomeworkAdaptationStatus.execute(
      generator.id,
      "teacher-1",
    );

    expect(result).toEqual({
      homeworkId: generator.id,
      status: "processando",
      adaptations: [
        {
          learningProfileId: PROFILE_TTS.id,
          status: "processando",
        },
      ],
    });
    expect(result.adaptations[0]).not.toHaveProperty("failedReason");
  });

  it("não retorna variante incompleta (sem áudio TTS) como concluida", async () => {
    const {
      generator,
      homeworkRepository,
      adaptationJobStatus,
      getHomeworkAdaptationStatus,
    } = await buildScenario();

    const incomplete = await homeworkRepository.upsertAdaptation({
      title: "Adaptada",
      content: "Texto simplificado",
      glossary: null,
      homeworkId: generator.id,
      learningProfileId: PROFILE_TTS.id,
      classId: "class-1",
      teacherId: "teacher-1",
    });

    adaptationJobStatus.snapshots.push({
      learningProfileId: PROFILE_TTS.id,
      state: "active",
      attemptsMade: 1,
    });

    const result = await getHomeworkAdaptationStatus.execute(
      generator.id,
      "teacher-1",
    );

    expect(result).toEqual({
      homeworkId: generator.id,
      status: "processando",
      adaptations: [
        {
          learningProfileId: PROFILE_TTS.id,
          status: "processando",
        },
      ],
    });
    expect(result.adaptations[0]).not.toHaveProperty("variantId");
    expect(incomplete.audioFileId).toBeNull();
  });

  it("retorna concluido com variantId somente quando a variante está completa", async () => {
    const {
      generator,
      homeworkRepository,
      getHomeworkAdaptationStatus,
    } = await buildScenario();

    const variant = await homeworkRepository.upsertAdaptation({
      title: "Adaptada",
      content: "Texto simplificado",
      glossary: null,
      homeworkId: generator.id,
      learningProfileId: PROFILE_TTS.id,
      classId: "class-1",
      teacherId: "teacher-1",
    });
    await homeworkRepository.attachAudioFile(variant.id, "file-audio-1");

    const result = await getHomeworkAdaptationStatus.execute(
      generator.id,
      "teacher-1",
    );

    expect(result).toEqual({
      homeworkId: generator.id,
      status: "concluido",
      adaptations: [
        {
          learningProfileId: PROFILE_TTS.id,
          status: "concluido",
          variantId: variant.id,
        },
      ],
    });
  });

  it("rejeita homework inexistente ou de outro professor", async () => {
    const { generator, getHomeworkAdaptationStatus } = await buildScenario();

    await expect(
      getHomeworkAdaptationStatus.execute("inexistente", "teacher-1"),
    ).rejects.toBeInstanceOf(HomeworkNotFoundError);

    await expect(
      getHomeworkAdaptationStatus.execute(generator.id, "teacher-2"),
    ).rejects.toBeInstanceOf(HomeworkAccessDeniedError);
  });

  it("rejeita quando o id não é de uma geradora", async () => {
    const {
      generator,
      homeworkRepository,
      getHomeworkAdaptationStatus,
    } = await buildScenario();

    const variant = await homeworkRepository.upsertAdaptation({
      title: "Variante",
      content: "Texto",
      glossary: null,
      homeworkId: generator.id,
      learningProfileId: PROFILE_NO_TTS.id,
      classId: "class-1",
      teacherId: "teacher-1",
    });

    await expect(
      getHomeworkAdaptationStatus.execute(variant.id, "teacher-1"),
    ).rejects.toBeInstanceOf(HomeworkNotGeneratorError);
  });
});
