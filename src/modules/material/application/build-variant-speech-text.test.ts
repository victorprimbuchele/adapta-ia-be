import { buildVariantSpeechText } from "./build-variant-speech-text.js";

describe("buildVariantSpeechText", () => {
  it("monta o texto do TTS a partir do título e conteúdo da variante", () => {
    expect(
      buildVariantSpeechText({
        title: "  Frações simples  ",
        content: "  Parte de um todo.  ",
      }),
    ).toBe("Frações simples.\n\nParte de um todo.");
  });
});
