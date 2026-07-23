import { resolvePdfTemplateTheme } from "./pdf-template-theme.js";

const basePrompt = {
  kind: "base" as const,
  combines: ["P1"],
  instructions: "instruções",
};

describe("resolvePdfTemplateTheme", () => {
  it("P1: layout linear, paleta padrão, glossário visível", () => {
    expect(
      resolvePdfTemplateTheme({
        ...basePrompt,
        code: "P1",
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
      }),
    ).toEqual({
      code: "P1",
      palette: "standard",
      typography: "comfortable",
      layout: "linear",
      showGlossary: true,
      screenReaderOptimized: false,
    });
  });

  it("P2: layout estruturado para microtarefas", () => {
    expect(
      resolvePdfTemplateTheme({
        ...basePrompt,
        code: "P2",
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
      }),
    ).toEqual({
      code: "P2",
      palette: "standard",
      typography: "comfortable",
      layout: "structured",
      showGlossary: false,
      screenReaderOptimized: false,
    });
  });

  it("P3: alto contraste, fonte grande e leitor de tela", () => {
    expect(
      resolvePdfTemplateTheme({
        ...basePrompt,
        code: "P3",
        combines: ["P3"],
        adaptations: {
          simplifyText: false,
          glossary: false,
          tts: false,
          microtasks: false,
          visualStructure: false,
          highContrast: true,
          largeFont: true,
          screenReader: true,
        },
      }),
    ).toEqual({
      code: "P3",
      palette: "high-contrast",
      typography: "large",
      layout: "linear",
      showGlossary: false,
      screenReaderOptimized: true,
    });
  });

  it("P1+P3: combina glossário com alto contraste e fonte grande", () => {
    expect(
      resolvePdfTemplateTheme({
        code: "P1+P3",
        kind: "composite",
        combines: ["P1", "P3"],
        instructions: "instruções",
        adaptations: {
          simplifyText: true,
          glossary: true,
          tts: true,
          microtasks: false,
          visualStructure: false,
          highContrast: true,
          largeFont: true,
          screenReader: true,
        },
      }),
    ).toEqual({
      code: "P1+P3",
      palette: "high-contrast",
      typography: "large",
      layout: "linear",
      showGlossary: true,
      screenReaderOptimized: true,
    });
  });
});
