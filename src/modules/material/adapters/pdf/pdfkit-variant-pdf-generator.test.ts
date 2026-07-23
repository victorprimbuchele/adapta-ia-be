import { PdfKitVariantPdfGenerator } from "./pdfkit-variant-pdf-generator.js";

const p1Prompt = {
  code: "P1",
  kind: "base" as const,
  combines: ["P1"],
  instructions: "instruções",
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
};

describe("PdfKitVariantPdfGenerator", () => {
  const generator = new PdfKitVariantPdfGenerator();

  it("gera PDF válido com título e conteúdo da variante", async () => {
    const { data } = await generator.generate({
      title: "Frações simples",
      content: "Uma fração representa uma parte de um todo.",
      question: "Qual é metade de 10?",
      glossary: [{ term: "fração", definition: "parte de um todo" }],
      profilePrompt: p1Prompt,
    });

    expect(data.subarray(0, 4).toString()).toBe("%PDF");
    expect(data.length).toBeGreaterThan(500);
  });

  it("gera PDF distinto por perfil sem glossário", async () => {
    const { data } = await generator.generate({
      title: "Microtarefas",
      content: "Passo um.\n\nPasso dois.",
      glossary: null,
      profilePrompt: {
        ...p1Prompt,
        code: "P2",
        combines: ["P2"],
        adaptations: {
          ...p1Prompt.adaptations,
          glossary: false,
          tts: false,
          microtasks: true,
          visualStructure: true,
        },
      },
    });

    expect(data.subarray(0, 4).toString()).toBe("%PDF");
    expect(data.length).toBeGreaterThan(100);
  });
});
