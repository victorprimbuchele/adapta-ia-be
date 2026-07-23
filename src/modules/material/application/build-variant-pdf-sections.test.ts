import {
  buildVariantPdfSections,
  formatGlossaryLine,
} from "./build-variant-pdf-sections.js";

describe("buildVariantPdfSections", () => {
  const p1Prompt = {
    code: "P1",
    kind: "base" as const,
    combines: ["P1"],
    instructions: "instruções",
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
  };

  it("formata linhas do glossário como termo: definição", () => {
    expect(
      formatGlossaryLine({
        term: "ecossistema",
        definition: "conjunto de seres vivos e o ambiente",
      }),
    ).toBe("ecossistema: conjunto de seres vivos e o ambiente");
  });

  it("preserva o texto simplificado integralmente no bloco de conteúdo", () => {
    const content = "O Sol é uma estrela. Ele aquece a Terra.";

    const sections = buildVariantPdfSections({
      title: "O Sol",
      content,
      glossary: [{ term: "estrela", definition: "astro que produz luz" }],
      profilePrompt: p1Prompt,
    });

    expect(sections.contentBlocks).toEqual([content]);
  });
});
