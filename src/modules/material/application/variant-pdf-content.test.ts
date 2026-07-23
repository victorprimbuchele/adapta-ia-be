import { PdfKitVariantPdfGenerator } from "../adapters/pdf/pdfkit-variant-pdf-generator.js";
import {
  buildVariantPdfSections,
  formatGlossaryLine,
} from "./build-variant-pdf-sections.js";
import { renderVariantPdfHtml } from "./render-variant-pdf-html.js";

const simplifiedContent =
  "Uma fração representa uma parte de um todo dividido em partes iguais.";
const glossary = [
  { term: "fração", definition: "parte de um todo" },
  { term: "numerador", definition: "número de partes que você tem" },
];

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

const p2Prompt = {
  code: "P2",
  kind: "base" as const,
  combines: ["P2"],
  instructions: "instruções",
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
};

const baseInput = {
  title: "Frações simples",
  content: simplifiedContent,
  question: "Qual é metade de 10?",
};

describe("conteúdo do PDF adaptado (Épico 6, BE-E6.4)", () => {
  const pdfGenerator = new PdfKitVariantPdfGenerator();

  describe("seções textuais do PDF", () => {
    it("inclui texto simplificado, questão e glossário no perfil P1", () => {
      const sections = buildVariantPdfSections({
        ...baseInput,
        glossary,
        profilePrompt: p1Prompt,
      });

      expect(sections.theme.showGlossary).toBe(true);
      expect(sections.title).toBe("Frações simples");
      expect(sections.contentBlocks).toEqual([simplifiedContent]);
      expect(sections.question).toBe("Qual é metade de 10?");
      expect(sections.glossaryEntries).toEqual(glossary);
      expect(formatGlossaryLine(glossary[0]!)).toBe(
        "fração: parte de um todo",
      );
      expect(formatGlossaryLine(glossary[1]!)).toBe(
        "numerador: número de partes que você tem",
      );
    });

    it("omite glossário quando o perfil não pede", () => {
      const sections = buildVariantPdfSections({
        title: "Microtarefas",
        content: "Passo um.\n\nPasso dois.",
        glossary,
        profilePrompt: p2Prompt,
      });

      expect(sections.theme.showGlossary).toBe(false);
      expect(sections.glossaryEntries).toEqual([]);
      expect(sections.contentBlocks).toEqual(["Passo um.", "Passo dois."]);
    });

    it("fragmenta conteúdo em passos no layout estruturado do P2", () => {
      const sections = buildVariantPdfSections({
        title: "Atividade em passos",
        content: "Leia o enunciado.\n\nResponda com calma.",
        glossary: null,
        profilePrompt: p2Prompt,
      });

      expect(sections.theme.layout).toBe("structured");
      expect(sections.contentBlocks).toEqual([
        "Leia o enunciado.",
        "Responda com calma.",
      ]);
    });
  });

  describe("PDF binário (pdfkit)", () => {
    it("gera PDF válido a partir das seções da variante", async () => {
      const { data } = await pdfGenerator.generate({
        ...baseInput,
        glossary,
        profilePrompt: p1Prompt,
      });

      expect(data.subarray(0, 4).toString()).toBe("%PDF");
      expect(data.length).toBeGreaterThan(500);
    });
  });

  describe("HTML do template (formatação)", () => {
    it("renderiza conteúdo simplificado e glossário em seções distintas no P1", () => {
      const html = renderVariantPdfHtml({
        ...baseInput,
        glossary,
        profilePrompt: p1Prompt,
      });

      expect(html).toContain(
        `<section class="content-panel" aria-label="Conteúdo da atividade">`,
      );
      expect(html).toContain(simplifiedContent);
      expect(html).toContain('<section class="glossary"');
      expect(html).toContain("<dt>fração</dt><dd>parte de um todo</dd>");
      expect(html).toContain(
        "<dt>numerador</dt><dd>número de partes que você tem</dd>",
      );
      expect(html).toContain('<h2 id="question-heading">Questão</h2>');
      expect(html).toContain("Qual é metade de 10?");
    });

    it("formata passos numerados no painel estruturado do P2", () => {
      const html = renderVariantPdfHtml({
        title: "Atividade em passos",
        content: "Leia o enunciado.\n\nResponda com calma.",
        glossary: null,
        profilePrompt: p2Prompt,
      });

      expect(html).toContain('class="content-panel structured"');
      expect(html).toContain("<p>Leia o enunciado.</p>");
      expect(html).toContain("<p>Responda com calma.</p>");
      expect(html).toContain("counter(step)");
      expect(html).not.toContain("Glossário");
    });
  });
});
