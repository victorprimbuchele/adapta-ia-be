import PDFDocument from "pdfkit";

import type { LearningProfilePrompt } from "../../../escola/domain/learning-profile-prompt.js";
import type { GlossaryEntry } from "../../domain/glossary.js";
import {
  buildVariantPdfContentBlocks,
} from "../../application/build-variant-pdf-sections.js";
import { resolvePdfTemplateTheme } from "../../domain/pdf-template-theme.js";
import type {
  GenerateVariantPdfInput,
  GeneratedPdf,
  PdfGeneratorPort,
} from "../../ports/pdf-generator.js";

interface PdfPalette {
  pageBg: string;
  text: string;
  heading: string;
  accent: string;
  panelBg: string;
}

function paletteFor(profilePrompt: LearningProfilePrompt): PdfPalette {
  const theme = resolvePdfTemplateTheme(profilePrompt);

  if (theme.palette === "high-contrast") {
    return {
      pageBg: "#000000",
      text: "#FFFFFF",
      heading: "#FFFF00",
      accent: "#FFFF00",
      panelBg: "#1A1A1A",
    };
  }

  return {
    pageBg: "#FFFFFF",
    text: "#1A2D27",
    heading: "#1A2D27",
    accent: "#2E7D6B",
    panelBg: "#F4F8F6",
  };
}

function fontSizes(profilePrompt: LearningProfilePrompt): {
  title: number;
  body: number;
  section: number;
} {
  const theme = resolvePdfTemplateTheme(profilePrompt);
  const isLarge = theme.typography === "large";

  return {
    title: isLarge ? 24 : 20,
    body: isLarge ? 16 : 12,
    section: isLarge ? 18 : 14,
  };
}

function contentBlocks(content: string, profilePrompt: LearningProfilePrompt): string[] {
  return buildVariantPdfContentBlocks(content, profilePrompt);
}

function renderPdfDocument(
  input: GenerateVariantPdfInput,
  doc: PDFKit.PDFDocument,
): void {
  const theme = resolvePdfTemplateTheme(input.profilePrompt);
  const colors = paletteFor(input.profilePrompt);
  const sizes = fontSizes(input.profilePrompt);
  const margin = 50;
  const contentWidth = doc.page.width - margin * 2;

  doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.pageBg);

  doc.fillColor(colors.heading)
    .font("Helvetica-Bold")
    .fontSize(sizes.title)
    .text(input.title.trim(), margin, margin, { width: contentWidth });

  let y = doc.y + 20;

  doc.fillColor(colors.text).font("Helvetica").fontSize(sizes.body);

  const blocks = contentBlocks(input.content, input.profilePrompt);
  blocks.forEach((block, index) => {
    if (theme.layout === "structured" && blocks.length > 1) {
      doc.fillColor(colors.accent)
        .font("Helvetica-Bold")
        .fontSize(sizes.body)
        .text(`${index + 1}.`, margin, y, { continued: false, width: 24 });

      doc.fillColor(colors.text)
        .font("Helvetica")
        .fontSize(sizes.body)
        .text(block, margin + 28, y, { width: contentWidth - 28 });
    } else {
      doc.fillColor(colors.text)
        .font("Helvetica")
        .fontSize(sizes.body)
        .text(block, margin, y, { width: contentWidth });
    }

    y = doc.y + 14;
    doc.y = y;
  });

  if (input.question?.trim()) {
    y = doc.y + 10;
    doc.fillColor(colors.heading)
      .font("Helvetica-Bold")
      .fontSize(sizes.section)
      .text("Questão", margin, y, { width: contentWidth });
    y = doc.y + 8;
    doc.fillColor(colors.text)
      .font("Helvetica")
      .fontSize(sizes.body)
      .text(input.question.trim(), margin, y, { width: contentWidth });
  }

  if (theme.showGlossary && input.glossary && input.glossary.length > 0) {
    y = doc.y + 20;
    doc.fillColor(colors.heading)
      .font("Helvetica-Bold")
      .fontSize(sizes.section)
      .text("Glossário", margin, y, { width: contentWidth });

    input.glossary.forEach((entry: GlossaryEntry) => {
      y = doc.y + 10;
      doc.fillColor(colors.heading)
        .font("Helvetica-Bold")
        .fontSize(sizes.body)
        .text(`${entry.term}:`, margin, y, { continued: true, width: contentWidth });
      doc.fillColor(colors.text)
        .font("Helvetica")
        .fontSize(sizes.body)
        .text(` ${entry.definition}`, { width: contentWidth });
    });
  }

  doc.fillColor(colors.text)
    .font("Helvetica")
    .fontSize(9)
    .text(
      `Adapta.ia — material adaptado ao perfil ${theme.code}`,
      margin,
      doc.page.height - margin,
      { width: contentWidth, align: "center" },
    );
}

/**
 * Adapter pdfkit de `PdfGeneratorPort` (Épico 6, BE-E6.2).
 * Usa os mesmos tokens de template que o HTML por perfil.
 */
export class PdfKitVariantPdfGenerator implements PdfGeneratorPort {
  async generate(input: GenerateVariantPdfInput): Promise<GeneratedPdf> {
    const data: Buffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 0, autoFirstPage: true });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      renderPdfDocument(input, doc);
      doc.end();
    });

    return { data, mimeType: "application/pdf" };
  }
}
