import { z } from "zod";

import { buildAdaptationMessages } from "../../application/build-adaptation-messages.js";
import { isRetriableHttpStatus } from "../../application/is-retriable-adaptation-error.js";
import { LlmAdaptationError } from "../../domain/errors.js";
import { glossarySchema } from "../../domain/glossary.js";
import type {
  TextSimplifierInput,
  TextSimplifierPort,
  TextSimplifierResult,
} from "../../ports/text-simplifier.js";

const llmResultSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  glossary: glossarySchema.optional(),
});

interface ChatCompletionsResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

/**
 * Adapter LLM OpenAI-compatible (chat completions) para `TextSimplifierPort`
 * (Épico 5, BE-E5.3 / ADR 003). Funciona com OpenAI, Groq, OpenRouter, etc.
 *
 * Env: `LLM_API_KEY` (obrigatória), `LLM_BASE_URL`, `LLM_MODEL`.
 */
export class OpenAiCompatibleTextSimplifier implements TextSimplifierPort {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(options?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  }) {
    const apiKey = options?.apiKey ?? process.env["LLM_API_KEY"];
    if (!apiKey) {
      throw new Error("LLM_API_KEY is required.");
    }

    this.apiKey = apiKey;
    this.baseUrl = (
      options?.baseUrl ??
      process.env["LLM_BASE_URL"] ??
      "https://api.openai.com/v1"
    ).replace(/\/$/, "");
    this.model =
      options?.model ?? process.env["LLM_MODEL"] ?? "gpt-4o-mini";
  }

  async simplify(input: TextSimplifierInput): Promise<TextSimplifierResult> {
    const messages = buildAdaptationMessages(input);
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new LlmAdaptationError(
        `LLM retornou HTTP ${response.status}: ${body.slice(0, 300)}`,
        { retriable: isRetriableHttpStatus(response.status) },
      );
    }

    const payload = (await response.json()) as ChatCompletionsResponse;
    const rawContent = payload.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new LlmAdaptationError(
        "LLM retornou resposta vazia (sem content).",
      );
    }

    return parseLlmResult(rawContent);
  }
}

function parseLlmResult(rawContent: string): TextSimplifierResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(stripMarkdownFence(rawContent));
  } catch {
    throw new LlmAdaptationError(
      "LLM retornou JSON inválido na adaptação da homework.",
    );
  }

  const result = llmResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new LlmAdaptationError(
      "LLM retornou JSON fora do schema esperado (title/content).",
    );
  }

  return {
    title: result.data.title,
    content: result.data.content,
    ...(result.data.glossary && result.data.glossary.length > 0
      ? { glossary: result.data.glossary }
      : {}),
  };
}

function stripMarkdownFence(value: string): string {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
}
