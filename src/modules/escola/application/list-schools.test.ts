import { ListSchools } from "./list-schools.js";
import { InMemorySchoolRepository } from "./test-utils/in-memory-school-repository.js";

describe("ListSchools", () => {
  it("retorna as escolas de referência cadastradas (via seed)", async () => {
    const now = new Date();
    const repository = new InMemorySchoolRepository([
      {
        id: "school-1",
        name: "Escola Municipal João de Barro",
        city: "São Paulo",
        state: "SP",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "school-2",
        name: "Colégio Estadual Dom Pedro II",
        city: "Rio de Janeiro",
        state: "RJ",
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const listSchools = new ListSchools(repository);

    const schools = await listSchools.execute();

    expect(schools).toHaveLength(2);
    expect(schools.map((school) => school.name)).toEqual([
      "Escola Municipal João de Barro",
      "Colégio Estadual Dom Pedro II",
    ]);
  });

  it("retorna lista vazia quando não há escolas cadastradas", async () => {
    const repository = new InMemorySchoolRepository();
    const listSchools = new ListSchools(repository);

    const schools = await listSchools.execute();

    expect(schools).toEqual([]);
  });
});
