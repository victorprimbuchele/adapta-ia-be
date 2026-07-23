import { renderVariantPdfHtml } from "./render-variant-pdf-html.js";

const glossary = [{ term: "fração", definition: "parte de um todo" }];

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

const p3Prompt = {
  code: "P3",
  kind: "base" as const,
  combines: ["P3"],
  instructions: "instruções",
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
};

const baseInput = {
  title: "Frações simples",
  content: "Uma fração representa uma parte de um todo.",
  question: "Qual é metade de 10?",
};

describe("renderVariantPdfHtml", () => {
  it("P1 inclui glossário e usa paleta padrão", () => {
    const html = renderVariantPdfHtml({
      ...baseInput,
      glossary,
      profilePrompt: p1Prompt,
    });

    expect(html).toContain('data-pdf-template="P1"');
    expect(html).toContain('data-pdf-palette="standard"');
    expect(html).toContain("Glossário");
    expect(html).toContain("fração");
    expect(html).toContain("#F4F8F6");
    expect(html).not.toContain('class="content-panel structured"');
    expect(html).toMatch(/body\s*\{[^}]*font-size:\s*16px/s);
  });

  it("P2 usa layout estruturado com passos numerados", () => {
    const html = renderVariantPdfHtml({
      ...baseInput,
      content: "Passo um.\n\nPasso dois.",
      glossary: null,
      profilePrompt: p2Prompt,
    });

    expect(html).toContain('data-pdf-template="P2"');
    expect(html).toContain('class="content-panel structured"');
    expect(html).toContain("counter(step)");
    expect(html).not.toContain("Glossário");
    expect(html).not.toContain("#000000");
  });

  it("P3 usa alto contraste, fonte grande e marcação semântica", () => {
    const html = renderVariantPdfHtml({
      ...baseInput,
      glossary: null,
      profilePrompt: p3Prompt,
    });

    expect(html).toContain('data-pdf-template="P3"');
    expect(html).toContain('data-pdf-palette="high-contrast"');
    expect(html).toContain("#000000");
    expect(html).toContain("#FFFF00");
    expect(html).toMatch(/body\s*\{[^}]*font-size:\s*22px/s);
    expect(html).toContain('role="main"');
    expect(html).toContain("aria-label=");
    expect(html).not.toContain("Glossário");
  });

  it("produz HTML distinto entre P1, P2 e P3", () => {
    const p1Html = renderVariantPdfHtml({
      ...baseInput,
      glossary,
      profilePrompt: p1Prompt,
    });
    const p2Html = renderVariantPdfHtml({
      ...baseInput,
      glossary: null,
      profilePrompt: p2Prompt,
    });
    const p3Html = renderVariantPdfHtml({
      ...baseInput,
      glossary: null,
      profilePrompt: p3Prompt,
    });

    expect(p1Html).not.toEqual(p2Html);
    expect(p1Html).not.toEqual(p3Html);
    expect(p2Html).not.toEqual(p3Html);
  });

  it("escapa HTML no título e no conteúdo", () => {
    const html = renderVariantPdfHtml({
      title: "<script>alert(1)</script>",
      content: "Texto & mais",
      glossary: null,
      profilePrompt: p1Prompt,
    });

    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("Texto &amp; mais");
    expect(html).not.toContain("<script>");
  });
});
