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

async function buildScenario(overrides?: { profile?: LearningProfile }) {
  const profile = overrides?.profile ?? PROFILE_P1;
  const homeworkRepository = new InMemoryHomeworkRepository();
  const learningProfileRepository = new InMemoryLearningProfileRepository([
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
  it("chama a LLM com prompt do perfil + conteúdo estruturado da geradora", async () => {
    const { generator, textSimplifier, processHomeworkAdaptation } =
      await buildScenario();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const result = await processHomeworkAdaptation.execute({
      homeworkId: generator.id,
      learningProfileId: PROFILE_P1.id,
      teacherId: "teacher-1",
    });

    expect(textSimplifier.calls).toHaveLength(1);
    expect(textSimplifier.calls[0]).toEqual({
      profilePrompt: PROFILE_P1.prompt,
      homework: {
        title: generator.title,
        content: generator.content,
      },
    });
    expect(result).toEqual(textSimplifier.result);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(`homework=${generator.id}`),
    );

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
