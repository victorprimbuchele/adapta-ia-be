/**
 * Monta o texto enviado ao TTS a partir do título e conteúdo da variante
 * adaptada (Épico 5, BE-E5.6).
 */
export function buildVariantSpeechText(variant: {
  title: string;
  content: string;
}): string {
  return `${variant.title.trim()}.\n\n${variant.content.trim()}`;
}
