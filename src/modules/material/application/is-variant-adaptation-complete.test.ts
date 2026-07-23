import type { LearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";
import type { Homework } from "../domain/homework.js";
import { isVariantAdaptationComplete } from "./is-variant-adaptation-complete.js";

const basePrompt = (
  overrides: Partial<LearningProfilePrompt["adaptations"]>,
): LearningProfilePrompt => ({
  code: "P1",
  kind: "base",
  combines: ["P1"],
  adaptations: {
    simplifyText: true,
    glossary: false,
    tts: false,
    microtasks: false,
    visualStructure: false,
    highContrast: false,
    largeFont: false,
    screenReader: false,
    ...overrides,
  },
  instructions: "Simplifique.",
});

const baseVariant = (overrides: Partial<Homework> = {}): Homework => ({
  id: "variant-1",
  title: "Título",
  content: "Conteúdo",
  glossary: null,
  isDraft: false,
  homeworkId: "generator-1",
  learningProfileId: "profile-1",
  audioFileId: null,
  contentFileId: null,
  classId: "class-1",
  teacherId: "teacher-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("isVariantAdaptationComplete", () => {
  it("considera completa quando não pede glossário nem TTS e tem PDF", () => {
    expect(
      isVariantAdaptationComplete(
        baseVariant({ contentFileId: "file-pdf" }),
        basePrompt({}),
      ),
    ).toBe(true);
  });

  it("exige contentFileId (PDF) em toda variante", () => {
    expect(
      isVariantAdaptationComplete(baseVariant({ contentFileId: null }), basePrompt({})),
    ).toBe(false);
  });

  it("exige glossário quando o perfil pede", () => {
    expect(
      isVariantAdaptationComplete(
        baseVariant({ glossary: null }),
        basePrompt({ glossary: true }),
      ),
    ).toBe(false);

    expect(
      isVariantAdaptationComplete(
        baseVariant({ glossary: [] }),
        basePrompt({ glossary: true }),
      ),
    ).toBe(false);

    expect(
      isVariantAdaptationComplete(
        baseVariant({ glossary: [], contentFileId: "file-pdf" }),
        basePrompt({ glossary: true }),
      ),
    ).toBe(true);
  });

  it("exige audioFileId quando o perfil pede TTS", () => {
    expect(
      isVariantAdaptationComplete(
        baseVariant({ audioFileId: null }),
        basePrompt({ tts: true }),
      ),
    ).toBe(false);

    expect(
      isVariantAdaptationComplete(
        baseVariant({ audioFileId: "file-1", contentFileId: "file-pdf" }),
        basePrompt({ tts: true }),
      ),
    ).toBe(true);
  });
});
