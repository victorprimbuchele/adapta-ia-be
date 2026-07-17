import { ListClasses } from "./list-classes.js";
import { InMemoryClassRepository } from "./test-utils/in-memory-class-repository.js";

describe("ListClasses", () => {
  it("retorna apenas as turmas do professor autenticado", async () => {
    const classRepository = new InMemoryClassRepository();
    await classRepository.create({
      name: "Turma A",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });
    await classRepository.create({
      name: "Turma B",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-2",
    });
    const listClasses = new ListClasses(classRepository);

    const classes = await listClasses.execute("teacher-1");

    expect(classes).toHaveLength(1);
    expect(classes[0]).toMatchObject({
      name: "Turma A",
      teacherId: "teacher-1",
    });
  });

  it("retorna lista vazia quando o professor não possui turmas cadastradas", async () => {
    const classRepository = new InMemoryClassRepository();
    const listClasses = new ListClasses(classRepository);

    const classes = await listClasses.execute("teacher-sem-turmas");

    expect(classes).toEqual([]);
  });
});
