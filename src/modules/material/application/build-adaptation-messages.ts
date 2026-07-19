import type { LearningProfilePrompt } from "../../escola/domain/learning-profile-prompt.js";
import type { TextSimplifierInput } from "../ports/text-simplifier.js";

export interface AdaptationChatMessage {
  role: "system" | "user";
  content: string;
}

/**
 * Monta as mensagens da skill de adaptação (BE-E5.3): instruções do perfil
 * + flags de adaptação + conteúdo estruturado da homework geradora.
 */
export function buildAdaptationMessages(
  input: TextSimplifierInput,
): AdaptationChatMessage[] {
  return [
    { role: "system", content: buildSystemPrompt(input.profilePrompt) },
    { role: "user", content: buildUserPrompt(input.homework) },
  ];
}

function buildSystemPrompt(prompt: LearningProfilePrompt): string {
  const activeAdaptations = Object.entries(prompt.adaptations)
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag);

  const glossaryRule = prompt.adaptations.glossary
    ? "Inclua um array `glossary` com os termos mais complexos e suas definições simples."
    : "Não inclua glossário; omita o campo `glossary` ou use array vazio.";

  return [
    "Você é um assistente pedagógico da Adapta IA.",
    "Adapte a homework geradora para o perfil de aprendizagem indicado.",
    "Responda APENAS com JSON válido (sem markdown), no formato:",
    '{"title":"...","content":"...","glossary":[{"term":"...","definition":"..."}]}',
    "",
    `Perfil: ${prompt.code} (${prompt.kind}).`,
    `Adaptações ativas: ${activeAdaptations.join(", ") || "nenhuma"}.`,
    glossaryRule,
    "Preserve o objetivo pedagógico e o idioma original (português).",
    "",
    "Instruções do perfil:",
    prompt.instructions,
  ].join("\n");
}

function buildUserPrompt(homework: TextSimplifierInput["homework"]): string {
  return [
    "Adapte a seguinte homework:",
    "",
    `Título: ${homework.title}`,
    "",
    "Conteúdo:",
    homework.content,
  ].join("\n");
}
