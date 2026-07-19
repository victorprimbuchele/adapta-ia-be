import { LlmAdaptationError } from "../../domain/errors.js";
import { OpenAiCompatibleTextSimplifier } from "./openai-compatible-text-simplifier.js";

const PROFILE_PROMPT = {
  code: "P1",
  kind: "base" as const,
  combines: ["P1"],
  adaptations: {
    simplifyText: true,
    glossary: true,
    tts: false,
    microtasks: false,
    visualStructure: false,
    highContrast: false,
    largeFont: false,
    screenReader: false,
  },
  instructions: "Simplifique o texto.",
};

describe("OpenAiCompatibleTextSimplifier", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("exige LLM_API_KEY", () => {
    const previous = process.env["LLM_API_KEY"];
    delete process.env["LLM_API_KEY"];

    expect(() => new OpenAiCompatibleTextSimplifier()).toThrow(
      "LLM_API_KEY is required.",
    );

    if (previous !== undefined) {
      process.env["LLM_API_KEY"] = previous;
    }
  });

  it("envia skill/prompt e parseia JSON da LLM", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Frações simples",
                content: "Texto adaptado.",
                glossary: [{ term: "fração", definition: "parte de um todo" }],
              }),
            },
          },
        ],
      }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const simplifier = new OpenAiCompatibleTextSimplifier({
      apiKey: "test-key",
      baseUrl: "https://llm.example/v1",
      model: "test-model",
    });

    const result = await simplifier.simplify({
      profilePrompt: PROFILE_PROMPT,
      homework: {
        title: "Frações",
        content: "Conteúdo original",
      },
    });

    expect(result).toEqual({
      title: "Frações simples",
      content: "Texto adaptado.",
      glossary: [{ term: "fração", definition: "parte de um todo" }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://llm.example/v1/chat/completions",
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
      messages: Array<{ role: string; content: string }>;
    };
    expect(body.model).toBe("test-model");
    expect(body.messages[0]?.content).toContain("Simplifique o texto.");
    expect(body.messages[1]?.content).toContain("Conteúdo original");
  });

  it("falha quando a LLM responde HTTP de erro", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "boom",
    }) as unknown as typeof fetch;

    const simplifier = new OpenAiCompatibleTextSimplifier({
      apiKey: "test-key",
    });

    await expect(
      simplifier.simplify({
        profilePrompt: PROFILE_PROMPT,
        homework: { title: "A", content: "B" },
      }),
    ).rejects.toMatchObject({
      name: "LlmAdaptationError",
      retriable: true,
    });
  });

  it("marca HTTP 401 da LLM como não retriável", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "unauthorized",
    }) as unknown as typeof fetch;

    const simplifier = new OpenAiCompatibleTextSimplifier({
      apiKey: "test-key",
    });

    await expect(
      simplifier.simplify({
        profilePrompt: PROFILE_PROMPT,
        homework: { title: "A", content: "B" },
      }),
    ).rejects.toMatchObject({
      name: "LlmAdaptationError",
      retriable: false,
    });
  });
});
