import { renderDeliveryEmail } from "./render-delivery-email.js";

describe("renderDeliveryEmail", () => {
  it("inclui o nome do aluno, título e conteúdo da variante", () => {
    const email = renderDeliveryEmail({
      studentName: "Lucas Mendes",
      homeworkTitle: "Frações",
      variantContent: "Texto simplificado sobre frações.",
      glossary: null,
    });

    expect(email.subject).toContain("Frações");
    expect(email.html).toContain("Lucas Mendes");
    expect(email.html).toContain("Texto simplificado sobre frações.");
    expect(email.html).not.toContain("Glossário");
  });

  it("inclui o glossário quando presente", () => {
    const email = renderDeliveryEmail({
      studentName: "Ana",
      homeworkTitle: "Frações",
      variantContent: "Texto.",
      glossary: [{ term: "Fração", definition: "Parte de um todo." }],
    });

    expect(email.html).toContain("Glossário");
    expect(email.html).toContain("Fração");
    expect(email.html).toContain("Parte de um todo.");
  });

  it("inclui link de áudio quando informado (BE-E7.5)", () => {
    const email = renderDeliveryEmail({
      studentName: "Lucas",
      homeworkTitle: "Frações",
      variantContent: "Texto.",
      glossary: null,
      audioUrl: "http://localhost:3000/api/v1/arquivos/file-audio/publico?sig=abc",
    });

    expect(email.html).toContain("Ouça a versão em áudio da atividade");
    expect(email.html).toContain("/arquivos/file-audio/publico");
    expect(email.html).toContain("PDF da atividade está anexado");
  });

  it("escapa HTML no conteúdo para evitar injeção", () => {
    const email = renderDeliveryEmail({
      studentName: "<script>alert(1)</script>",
      homeworkTitle: "Título",
      variantContent: "Texto",
      glossary: null,
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
