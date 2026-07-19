import type { LearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";
import { resolveAdaptationGlossary } from "./resolve-adaptation-glossary.js";

const withGlossary: LearningProfilePrompt = {
  code: "P1",
  kind: "base",
  combines: ["P1"],
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
  instructions: "Simplifique e gere glossário.",
};

const withoutGlossary: LearningProfilePrompt = {
  ...withGlossary,
  code: "P2",
  adaptations: {
    ...withGlossary.adaptations,
    glossary: false,
    microtasks: true,
  },
};

describe("resolveAdaptationGlossary", () => {
  it("persiste array estruturado quando o perfil pede glossário", () => {
    expect(
      resolveAdaptationGlossary(withGlossary, [
        { term: "fração", definition: "parte de um todo" },
      ]),
    ).toEqual([{ term: "fração", definition: "parte de um todo" }]);
  });

  it("persiste array vazio quando o perfil pede glossário e a LLM omite", () => {
    expect(resolveAdaptationGlossary(withGlossary, undefined)).toEqual([]);
  });

  it("persiste null quando o perfil não pede glossário", () => {
    expect(
      resolveAdaptationGlossary(withoutGlossary, [
        { term: "x", definition: "y" },
      ]),
    ).toBeNull();
  });
});
