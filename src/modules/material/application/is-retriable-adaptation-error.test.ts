import { LearningProfileNotFoundError } from "../../escola/domain/errors.js";
import {
  InvalidLearningProfilePromptError,
  LlmAdaptationError,
  TtsAdaptationError,
} from "../domain/errors.js";
import {
  isRetriableAdaptationError,
  isRetriableHttpStatus,
} from "./is-retriable-adaptation-error.js";

describe("isRetriableAdaptationError", () => {
  it("considera LLM/TTS retriáveis por padrão", () => {
    expect(isRetriableAdaptationError(new LlmAdaptationError("boom"))).toBe(
      true,
    );
    expect(isRetriableAdaptationError(new TtsAdaptationError("boom"))).toBe(
      true,
    );
  });

  it("respeita retriable: false em LLM/TTS", () => {
    expect(
      isRetriableAdaptationError(
        new LlmAdaptationError("bad request", { retriable: false }),
      ),
    ).toBe(false);
    expect(
      isRetriableAdaptationError(
        new TtsAdaptationError("texto vazio", { retriable: false }),
      ),
    ).toBe(false);
  });

  it("não retenta erros de domínio/validação", () => {
    expect(
      isRetriableAdaptationError(
        new InvalidLearningProfilePromptError("profile-1"),
      ),
    ).toBe(false);
    expect(
      isRetriableAdaptationError(new LearningProfileNotFoundError("profile-1")),
    ).toBe(false);
  });

  it("retenta erros desconhecidos (rede etc.)", () => {
    expect(isRetriableAdaptationError(new Error("ECONNRESET"))).toBe(true);
  });
});

describe("isRetriableHttpStatus", () => {
  it("marca 408/429/5xx como retriáveis e 4xx restantes como não", () => {
    expect(isRetriableHttpStatus(408)).toBe(true);
    expect(isRetriableHttpStatus(429)).toBe(true);
    expect(isRetriableHttpStatus(500)).toBe(true);
    expect(isRetriableHttpStatus(503)).toBe(true);
    expect(isRetriableHttpStatus(400)).toBe(false);
    expect(isRetriableHttpStatus(401)).toBe(false);
    expect(isRetriableHttpStatus(404)).toBe(false);
  });
});
