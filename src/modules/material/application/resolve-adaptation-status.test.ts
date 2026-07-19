import type { LearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";
import type { Homework } from "../domain/homework.js";
import {
  aggregateAdaptationStatus,
  resolveAdaptationStatus,
} from "./resolve-adaptation-status.js";

const promptWithTts: LearningProfilePrompt = {
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
  instructions: "Simplifique.",
};

const incompleteVariant: Homework = {
  id: "variant-1",
  title: "Título",
  content: "Conteúdo",
  glossary: null,
  isDraft: false,
  homeworkId: "generator-1",
  learningProfileId: "profile-1",
  audioFileId: null,
  classId: "class-1",
  teacherId: "teacher-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const completeVariant: Homework = {
  ...incompleteVariant,
  audioFileId: "file-1",
};

describe("resolveAdaptationStatus", () => {
  it("mapeia estados da fila", () => {
    expect(
      resolveAdaptationStatus({
        jobState: "waiting",
        variant: null,
        profilePrompt: promptWithTts,
      }),
    ).toBe("pendente");

    expect(
      resolveAdaptationStatus({
        jobState: "active",
        variant: incompleteVariant,
        profilePrompt: promptWithTts,
      }),
    ).toBe("processando");

    expect(
      resolveAdaptationStatus({
        jobState: "failed",
        variant: incompleteVariant,
        profilePrompt: promptWithTts,
      }),
    ).toBe("erro");
  });

  it("não marca como concluido variante sem áudio enquanto processa TTS", () => {
    expect(
      resolveAdaptationStatus({
        jobState: "active",
        variant: incompleteVariant,
        profilePrompt: promptWithTts,
      }),
    ).toBe("processando");

    expect(
      resolveAdaptationStatus({
        jobState: "unknown",
        variant: incompleteVariant,
        profilePrompt: promptWithTts,
      }),
    ).toBe("processando");
  });

  it("só retorna concluido quando a variante está completa", () => {
    expect(
      resolveAdaptationStatus({
        jobState: "completed",
        variant: completeVariant,
        profilePrompt: promptWithTts,
      }),
    ).toBe("concluido");

    expect(
      resolveAdaptationStatus({
        jobState: null,
        variant: completeVariant,
        profilePrompt: promptWithTts,
      }),
    ).toBe("concluido");

    expect(
      resolveAdaptationStatus({
        jobState: "completed",
        variant: incompleteVariant,
        profilePrompt: promptWithTts,
      }),
    ).toBe("erro");
  });
});

describe("aggregateAdaptationStatus", () => {
  it("prioriza erro > processando > pendente > concluido", () => {
    expect(aggregateAdaptationStatus([])).toBe("pendente");
    expect(
      aggregateAdaptationStatus(["concluido", "processando", "pendente"]),
    ).toBe("processando");
    expect(aggregateAdaptationStatus(["concluido", "erro"])).toBe("erro");
    expect(aggregateAdaptationStatus(["concluido", "pendente"])).toBe(
      "pendente",
    );
    expect(aggregateAdaptationStatus(["concluido", "concluido"])).toBe(
      "concluido",
    );
  });
});
