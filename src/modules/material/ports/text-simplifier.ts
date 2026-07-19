import type { LearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";

/**
 * Entrada da skill de adaptação textual (Épico 5, BE-E5.3 / ADR 003).
 * Combina `LearningProfile.prompt` com o conteúdo estruturado da geradora.
 */
export interface TextSimplifierInput {
  profilePrompt: LearningProfilePrompt;
  homework: {
    title: string;
    content: string;
  };
}

/**
 * Texto adaptado pela LLM. `glossary` só vem preenchido quando o perfil
 * pede glossário; a persistência da variante fica para tickets seguintes.
 */
export interface TextSimplifierResult {
  title: string;
  content: string;
  glossary?: Array<{ term: string; definition: string }>;
}

/**
 * Porta de simplificação/adaptação de texto via LLM (`TextSimplifierPort`
 * no ADR 003). Trocar de provedor = trocar o adapter.
 */
export interface TextSimplifierPort {
  simplify(input: TextSimplifierInput): Promise<TextSimplifierResult>;
}
