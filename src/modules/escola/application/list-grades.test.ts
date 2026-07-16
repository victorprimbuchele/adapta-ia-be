import { ListGrades } from "./list-grades.js";
import { InMemoryGradeRepository } from "./test-utils/in-memory-grade-repository.js";

describe("ListGrades", () => {
  it("retorna as séries de referência cadastradas (via seed)", async () => {
    const now = new Date();
    const repository = new InMemoryGradeRepository([
      { id: "grade-1", name: "1º Ano", sortOrder: 1, createdAt: now, updatedAt: now },
      { id: "grade-2", name: "2º Ano", sortOrder: 2, createdAt: now, updatedAt: now },
    ]);
    const listGrades = new ListGrades(repository);

    const grades = await listGrades.execute();

    expect(grades).toHaveLength(2);
    expect(grades.map((grade) => grade.name)).toEqual(["1º Ano", "2º Ano"]);
  });

  it("retorna lista vazia quando não há séries cadastradas", async () => {
    const repository = new InMemoryGradeRepository();
    const listGrades = new ListGrades(repository);

    const grades = await listGrades.execute();

    expect(grades).toEqual([]);
  });
});
