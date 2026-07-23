import type { LearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";

/**
 * Tokens visuais do template de PDF (Épico 6, BE-E6.1).
 * Derivados das flags de adaptação do perfil — perfis-base e compostos
 * compartilham a mesma resolução via `adaptations`.
 */
export interface PdfTemplateTheme {
  /** Identificador legível do template (ex.: `P3`, `P1+P2+P3`). */
  code: string;
  /** Paleta padrão (P1/P2) ou alto contraste (P3 e compostos com P3). */
  palette: "standard" | "high-contrast";
  /** Tipografia confortável (P1) ou ampliada (P3). */
  typography: "comfortable" | "large";
  /** Layout linear ou com estrutura visual / microtarefas (P2). */
  layout: "linear" | "structured";
  /** Inclui bloco de glossário quando o perfil pede. */
  showGlossary: boolean;
  /** Marcação semântica reforçada para leitores de tela (P3). */
  screenReaderOptimized: boolean;
}

/**
 * Resolve o tema do PDF a partir do `LearningProfile.prompt`.
 * Perfis compostos herdam a combinação de flags já materializada no seed.
 */
export function resolvePdfTemplateTheme(
  profilePrompt: LearningProfilePrompt,
): PdfTemplateTheme {
  const { adaptations, code } = profilePrompt;

  return {
    code,
    palette: adaptations.highContrast ? "high-contrast" : "standard",
    typography: adaptations.largeFont ? "large" : "comfortable",
    layout:
      adaptations.microtasks || adaptations.visualStructure
        ? "structured"
        : "linear",
    showGlossary: adaptations.glossary,
    screenReaderOptimized: adaptations.screenReader,
  };
}
