import { TtsAdaptationError } from "../../domain/errors.js";
import { OpenAiCompatibleAudioGenerator } from "./openai-compatible-audio-generator.js";

describe("OpenAiCompatibleAudioGenerator", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("exige TTS_API_KEY ou LLM_API_KEY", () => {
    const previousTts = process.env["TTS_API_KEY"];
    const previousLlm = process.env["LLM_API_KEY"];
    delete process.env["TTS_API_KEY"];
    delete process.env["LLM_API_KEY"];

    expect(() => new OpenAiCompatibleAudioGenerator()).toThrow(
      "TTS_API_KEY or LLM_API_KEY is required.",
    );

    if (previousTts !== undefined) {
      process.env["TTS_API_KEY"] = previousTts;
    }
    if (previousLlm !== undefined) {
      process.env["LLM_API_KEY"] = previousLlm;
    }
  });

  it("envia o texto da variante e retorna áudio mp3", async () => {
    const audioBytes = Buffer.from([0x49, 0x44, 0x33]); // ID3
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () =>
        audioBytes.buffer.slice(
          audioBytes.byteOffset,
          audioBytes.byteOffset + audioBytes.byteLength,
        ),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const generator = new OpenAiCompatibleAudioGenerator({
      apiKey: "test-key",
      baseUrl: "https://tts.example/v1",
      model: "tts-1-hd",
      voice: "alloy",
    });

    const result = await generator.generate({
      text: "Título adaptado.\n\nConteúdo simplificado da variante.",
    });

    expect(result).toEqual({
      data: audioBytes,
      mimeType: "audio/mpeg",
      format: "mp3",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://tts.example/v1/audio/speech",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
        }),
      }),
    );

    const body = JSON.parse(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as {
      model: string;
      input: string;
      voice: string;
      response_format: string;
    };
    expect(body).toEqual({
      model: "tts-1-hd",
      input: "Título adaptado.\n\nConteúdo simplificado da variante.",
      voice: "alloy",
      response_format: "mp3",
    });
  });

  it("falha quando a API de TTS responde HTTP de erro", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "unavailable",
    }) as unknown as typeof fetch;

    const generator = new OpenAiCompatibleAudioGenerator({
      apiKey: "test-key",
    });

    await expect(
      generator.generate({ text: "Olá" }),
    ).rejects.toBeInstanceOf(TtsAdaptationError);
  });

  it("falha quando o texto da variante está vazio", async () => {
    const generator = new OpenAiCompatibleAudioGenerator({
      apiKey: "test-key",
    });

    await expect(generator.generate({ text: "   " })).rejects.toBeInstanceOf(
      TtsAdaptationError,
    );
  });
});
