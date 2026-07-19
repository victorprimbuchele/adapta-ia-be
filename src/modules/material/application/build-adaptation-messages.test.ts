import type { LearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";
import { buildAdaptationMessages } from "./build-adaptation-messages.js";

const PROFILE_P1: LearningProfilePrompt = {
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
  instructions: "Use linguagem simples e produza glossário.",
};

describe("buildAdaptationMessages", () => {
  it("monta system+user com instruções do perfil e conteúdo da geradora", () => {
    const messages = buildAdaptationMessages({
      profilePrompt: PROFILE_P1,
      homework: {
        title: "Frações",
        content: "Explique frações equivalentes.",
      },
    });

    expect(messages).toHaveLength(2);
    expect(messages[0]?.role).toBe("system");
    expect(messages[0]?.content).toContain("Use linguagem simples e produza glossário.");
    expect(messages[0]?.content).toContain("simplifyText");
    expect(messages[0]?.content).toContain("glossary");
    expect(messages[0]?.content).toContain("Inclua um array `glossary`");
    expect(messages[1]?.role).toBe("user");
    expect(messages[1]?.content).toContain("Título: Frações");
    expect(messages[1]?.content).toContain("Explique frações equivalentes.");
  });
});
