import type { Homework } from "../../material/domain/homework.js";
import {
  indexVariantsByLearningProfileId,
  resolveDeliveryVariantForProfile,
} from "./resolve-delivery-variant-for-profile.js";

function variant(id: string, learningProfileId: string | null, homeworkId = "gen-1"): Homework {
  return {
    id,
    title: `Variante ${id}`,
    content: "Conteúdo",
    subject: null,
    question: null,
    glossary: null,
    isDraft: false,
    homeworkId,
    learningProfileId,
    audioFileId: null,
    contentFileId: "pdf-1",
    classId: "class-1",
    teacherId: "teacher-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("resolveDeliveryVariantForProfile (BE-E7.3 / BE-E7.11)", () => {
  const generator = variant("gen-1", null, null);
  const variantP1 = variant("var-p1", "profile-1");
  const variantP2 = variant("var-p2", "profile-2");
  const byProfileId = indexVariantsByLearningProfileId([generator, variantP1, variantP2]);

  it("retorna a variante cujo learningProfileId corresponde exatamente ao perfil do aluno", () => {
    expect(resolveDeliveryVariantForProfile("profile-1", byProfileId)?.id).toBe("var-p1");
    expect(resolveDeliveryVariantForProfile("profile-2", byProfileId)?.id).toBe("var-p2");
  });

  it("nunca retorna a homework geradora", () => {
    expect(byProfileId.has("gen-1")).toBe(false);
    expect(byProfileId.get(generator.id)).toBeUndefined();
  });

  it("retorna undefined quando não há variante para o perfil", () => {
    expect(resolveDeliveryVariantForProfile("profile-inexistente", byProfileId)).toBeUndefined();
  });
});
