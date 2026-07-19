import { updateHomeworkSchema } from "./update-homework.dto.js";

function buildInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Interpretação de texto",
    content: "Leia o texto abaixo com atenção.",
    question: "Qual é a ideia principal do texto?",
    subject: "Língua Portuguesa",
    classId: "class-1",
    ...overrides,
  };
}

function messagesOf(result: ReturnType<typeof updateHomeworkSchema.safeParse>) {
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
}

describe("updateHomeworkSchema", () => {
  it("accepts a complete payload and trims surrounding whitespace", () => {
    const result = updateHomeworkSchema.safeParse(
      buildInput({
        title: "  Interpretação de texto  ",
        content: "  Leia o texto.  ",
        question: "  Qual a ideia principal?  ",
        subject: "  Língua Portuguesa  ",
        classId: "  class-1  ",
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        title: "Interpretação de texto",
        content: "Leia o texto.",
        question: "Qual a ideia principal?",
        subject: "Língua Portuguesa",
        classId: "class-1",
      });
    }
  });

  it("rejects an incomplete payload with clear per-field errors", () => {
    const result = updateHomeworkSchema.safeParse({});

    expect(result.success).toBe(false);
    const messages = messagesOf(result);
    expect(messages).toEqual(
      expect.arrayContaining([
        "Homework title is required.",
        "Homework main content is required.",
        "Homework question is required.",
        "Subject is required.",
        "Class is required.",
      ]),
    );
  });
});
