import { UnrecoverableError } from "bullmq";

import {
  InvalidLearningProfilePromptError,
  LlmAdaptationError,
  TtsAdaptationError,
} from "../domain/errors.js";
import { toAdaptationJobError } from "./to-adaptation-job-error.js";

describe("toAdaptationJobError", () => {
  it("converte falha LLM/TTS retriável em Error com mensagem ao professor", () => {
    const error = toAdaptationJobError(
      new LlmAdaptationError("LLM retornou HTTP 503: unavailable"),
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(UnrecoverableError);
    expect(error.message).toBe(
      "Falha ao adaptar o texto com a IA. Tente novamente em instantes.",
    );
  });

  it("converte falha permanente em UnrecoverableError (sem retry)", () => {
    const error = toAdaptationJobError(
      new InvalidLearningProfilePromptError("profile-bad"),
    );

    expect(error).toBeInstanceOf(UnrecoverableError);
    expect(error.message).toContain("profile-bad");
  });

  it("não retenta TTS com retriable false", () => {
    const error = toAdaptationJobError(
      new TtsAdaptationError("Texto da variante vazio", { retriable: false }),
    );

    expect(error).toBeInstanceOf(UnrecoverableError);
    expect(error.message).toBe(
      "Falha ao gerar o áudio da atividade. Tente novamente em instantes.",
    );
  });
});
