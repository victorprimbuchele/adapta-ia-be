import type { LearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";
import type { GlossaryEntry } from "../domain/glossary.js";

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
 * Texto adaptado pela LLM. `glossary` é o JSON estruturado gerado a partir
 * do conteúdo simplificado quando o perfil pede (Épico 5, BE-E5.4).
 */
export interface TextSimplifierResult {
  title: string;
  content: string;
  glossary?: GlossaryEntry[];
}

/**
 * Porta de simplificação/adaptação de texto via LLM (`TextSimplifierPort`
 * no ADR 003). Trocar de provedor = trocar o adapter.
 */
export interface TextSimplifierPort {
  simplify(input: TextSimplifierInput): Promise<TextSimplifierResult>;
}
