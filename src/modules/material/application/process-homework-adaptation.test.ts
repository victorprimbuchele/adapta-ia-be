import { LearningProfileNotFoundError } from "../../escola/domain/errors.js";
import type { LearningProfile } from "../../escola/domain/learning-profile.js";
import { InMemoryLearningProfileRepository } from "../../escola/application/test-utils/in-memory-learning-profile-repository.js";
import {
  HomeworkAccessDeniedError,
  HomeworkNotFoundError,
  HomeworkNotGeneratorError,
  InvalidLearningProfilePromptError,
} from "../domain/errors.js";
import { ProcessHomeworkAdaptation } from "./process-homework-adaptation.js";
import { InMemoryHomeworkRepository } from "./test-utils/in-memory-homework-repository.js";
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
  const processHomeworkAdaptation = new ProcessHomeworkAdaptation(
    homeworkRepository,
    learningProfileRepository,
    textSimplifier,
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
    processHomeworkAdaptation,
  };
}

describe("ProcessHomeworkAdaptation", () => {
  it("persiste variante adaptada com glossário JSON estruturado", async () => {
    const {
      generator,
      homeworkRepository,
      textSimplifier,
      processHomeworkAdaptation,
    } = await buildScenario();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const variant = await processHomeworkAdaptation.execute({
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
    expect(homeworkRepository.homeworks).toHaveLength(2);
    expect(
      homeworkRepository.homeworks.find((item) => item.id === variant.id)
        ?.glossary,
    ).toEqual([
      { term: "conceito", definition: "ideia principal do conteúdo" },
    ]);

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

    const variant = await processHomeworkAdaptation.execute({
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
    const { processHomeworkAdaptation, textSimplifier } = await buildScenario();

    await expect(
      processHomeworkAdaptation.execute({
        homeworkId: "inexistente",
        learningProfileId: PROFILE_P1.id,
        teacherId: "teacher-1",
      }),
    ).rejects.toBeInstanceOf(HomeworkNotFoundError);
    expect(textSimplifier.calls).toHaveLength(0);
  });

  it("nega acesso quando a homework é de outro professor", async () => {
    const { generator, processHomeworkAdaptation, textSimplifier } =
      await buildScenario();

    await expect(
      processHomeworkAdaptation.execute({
        homeworkId: generator.id,
        learningProfileId: PROFILE_P1.id,
        teacherId: "teacher-2",
      }),
    ).rejects.toBeInstanceOf(HomeworkAccessDeniedError);
    expect(textSimplifier.calls).toHaveLength(0);
  });

  it("rejeita quando a homework não é geradora", async () => {
    const {
      generator,
      homeworkRepository,
      processHomeworkAdaptation,
      textSimplifier,
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
  });

  it("rejeita perfil inexistente", async () => {
    const { generator, processHomeworkAdaptation, textSimplifier } =
      await buildScenario();

    await expect(
      processHomeworkAdaptation.execute({
        homeworkId: generator.id,
        learningProfileId: "perfil-inexistente",
        teacherId: "teacher-1",
      }),
    ).rejects.toBeInstanceOf(LearningProfileNotFoundError);
    expect(textSimplifier.calls).toHaveLength(0);
  });

  it("rejeita prompt de perfil inválido", async () => {
    const { generator, processHomeworkAdaptation, textSimplifier } =
      await buildScenario({
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
  });
});
