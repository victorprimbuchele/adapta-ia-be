import { ListLearningProfiles } from "./list-learning-profiles.js";
import { InMemoryLearningProfileRepository } from "./test-utils/in-memory-learning-profile-repository.js";

describe("ListLearningProfiles", () => {
  it("retorna o catálogo de perfis de aprendizagem cadastrados (via seed)", async () => {
    const repository = new InMemoryLearningProfileRepository([
      { id: "profile-1", name: "Simplificado + glossário + TTS", prompt: { code: "P1" } },
      { id: "profile-2", name: "Microtarefas + estrutura visual", prompt: { code: "P2" } },
    ]);
    const listLearningProfiles = new ListLearningProfiles(repository);

    const profiles = await listLearningProfiles.execute();

    expect(profiles).toHaveLength(2);
    expect(profiles.map((profile) => profile.name)).toEqual([
      "Microtarefas + estrutura visual",
      "Simplificado + glossário + TTS",
    ]);
  });

  it("retorna lista vazia quando não há perfis cadastrados", async () => {
    const repository = new InMemoryLearningProfileRepository();
    const listLearningProfiles = new ListLearningProfiles(repository);

    const profiles = await listLearningProfiles.execute();

    expect(profiles).toEqual([]);
  });
});
