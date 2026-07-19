/**
 * Áudio gerado via TTS a partir do texto da variante (Épico 5, BE-E5.6).
 * Em seguida é enviado ao storage e registrado em `File` (BE-E5.7).
 */
export interface GeneratedAudio {
  data: Buffer;
  mimeType: string;
  format: string;
}

export interface AudioGeneratorInput {
  text: string;
}

/**
 * Porta de geração de áudio via TTS (`AudioGeneratorPort` no ADR 003).
 * Trocar de provedor = trocar o adapter.
 */
export interface AudioGeneratorPort {
  generate(input: AudioGeneratorInput): Promise<GeneratedAudio>;
}
