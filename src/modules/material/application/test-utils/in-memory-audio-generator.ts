import type {
  AudioGeneratorInput,
  AudioGeneratorPort,
  GeneratedAudio,
} from "../../ports/audio-generator.js";

/**
 * Fake de `AudioGeneratorPort` em memória, usado apenas nos testes de
 * comportamento das camadas de application/domain (ver ADR 009).
 */
export class InMemoryAudioGenerator implements AudioGeneratorPort {
  readonly calls: AudioGeneratorInput[] = [];

  result: GeneratedAudio = {
    data: Buffer.from("fake-mp3-audio"),
    mimeType: "audio/mpeg",
    format: "mp3",
  };

  async generate(input: AudioGeneratorInput): Promise<GeneratedAudio> {
    this.calls.push(input);
    return this.result;
  }
}
