import { createHomeworkSchema } from "./create-homework.dto.js";

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

function messagesOf(result: ReturnType<typeof createHomeworkSchema.safeParse>) {
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
}

describe("createHomeworkSchema", () => {
  it("accepts a complete payload and trims surrounding whitespace", () => {
    const result = createHomeworkSchema.safeParse(
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
    const result = createHomeworkSchema.safeParse({});

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

  it("rejects empty, whitespace-only, or too-short title", () => {
    for (const title of ["", "   ", "A"]) {
      const result = createHomeworkSchema.safeParse(buildInput({ title }));

      expect(result.success).toBe(false);
      const messages = messagesOf(result);
      expect(
        messages.some(
          (message) =>
            message === "Homework title is required." ||
            message === "Homework title must have at least 2 characters.",
        ),
      ).toBe(true);
    }
  });

  it("rejects empty or whitespace-only main content", () => {
    for (const content of ["", "   "]) {
      const result = createHomeworkSchema.safeParse(buildInput({ content }));

      expect(result.success).toBe(false);
      expect(messagesOf(result)).toContain(
        "Homework main content is required.",
      );
    }
  });

  it("rejects empty or whitespace-only question", () => {
    for (const question of ["", "   "]) {
      const result = createHomeworkSchema.safeParse(buildInput({ question }));

      expect(result.success).toBe(false);
      expect(messagesOf(result)).toContain("Homework question is required.");
    }
  });

  it("rejects empty, whitespace-only, or too-short subject", () => {
    for (const subject of ["", "   ", "A"]) {
      const result = createHomeworkSchema.safeParse(buildInput({ subject }));

      expect(result.success).toBe(false);
      const messages = messagesOf(result);
      expect(
        messages.some(
          (message) =>
            message === "Subject is required." ||
            message === "Subject must have at least 2 characters.",
        ),
      ).toBe(true);
    }
  });

  it("rejects empty or whitespace-only class", () => {
    for (const classId of ["", "   "]) {
      const result = createHomeworkSchema.safeParse(buildInput({ classId }));

      expect(result.success).toBe(false);
      expect(messagesOf(result)).toContain("Class is required.");
    }
  });

  it("rejects invalid types with clear errors", () => {
    const result = createHomeworkSchema.safeParse(
      buildInput({
        title: 1,
        content: true,
        question: null,
        subject: {},
        classId: [],
      }),
    );

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
