import { isRetriableHttpStatus } from "../../application/is-retriable-adaptation-error.js";
import { TtsAdaptationError } from "../../domain/errors.js";
import type {
  AudioGeneratorInput,
  AudioGeneratorPort,
  GeneratedAudio,
} from "../../ports/audio-generator.js";

/**
 * Adapter TTS OpenAI-compatible (`/audio/speech`) para `AudioGeneratorPort`
 * (Épico 5, BE-E5.6 / ADR 003). Funciona com OpenAI e proxies compatíveis.
 *
 * Env: `TTS_API_KEY` (ou fallback `LLM_API_KEY`), `TTS_BASE_URL`,
 * `TTS_MODEL`, `TTS_VOICE`.
 */
export class OpenAiCompatibleAudioGenerator implements AudioGeneratorPort {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly voice: string;

  constructor(options?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    voice?: string;
  }) {
    const apiKey =
      options?.apiKey ??
      process.env["TTS_API_KEY"] ??
      process.env["LLM_API_KEY"];
    if (!apiKey) {
      throw new Error("TTS_API_KEY or LLM_API_KEY is required.");
    }

    this.apiKey = apiKey;
    this.baseUrl = (
      options?.baseUrl ??
      process.env["TTS_BASE_URL"] ??
      process.env["LLM_BASE_URL"] ??
      "https://api.openai.com/v1"
    ).replace(/\/$/, "");
    this.model = options?.model ?? process.env["TTS_MODEL"] ?? "tts-1";
    this.voice = options?.voice ?? process.env["TTS_VOICE"] ?? "nova";
  }

  async generate(input: AudioGeneratorInput): Promise<GeneratedAudio> {
    const text = input.text.trim();
    if (!text) {
      throw new TtsAdaptationError(
        "Texto da variante vazio; não é possível gerar áudio TTS.",
        { retriable: false },
      );
    }

    const response = await fetch(`${this.baseUrl}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
        voice: this.voice,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new TtsAdaptationError(
        `TTS retornou HTTP ${response.status}: ${body.slice(0, 300)}`,
        { retriable: isRetriableHttpStatus(response.status) },
      );
    }

    const data = Buffer.from(await response.arrayBuffer());
    if (data.length === 0) {
      throw new TtsAdaptationError("TTS retornou áudio vazio.", {
        retriable: true,
      });
    }

    return {
      data,
      mimeType: "audio/mpeg",
      format: "mp3",
    };
  }
}
