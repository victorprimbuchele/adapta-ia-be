import { CreateDelivery } from "./create-delivery.js";
import { ListClassStudents } from "../../escola/application/list-class-students.js";
import { InMemoryClassRepository } from "../../escola/application/test-utils/in-memory-class-repository.js";
import { InMemoryStudentRepository } from "../../escola/application/test-utils/in-memory-student-repository.js";
import { InMemoryUserClassRepository } from "../../escola/application/test-utils/in-memory-user-class-repository.js";
import { InMemoryUserLearningProfileRepository } from "../../escola/application/test-utils/in-memory-user-learning-profile-repository.js";
import { InMemoryLearningProfileRepository } from "../../escola/application/test-utils/in-memory-learning-profile-repository.js";
import { InMemoryHomeworkRepository } from "../../material/application/test-utils/in-memory-homework-repository.js";
import { HomeworkNotGeneratorError } from "../../material/domain/errors.js";
import { NoRecipientsToDeliverError } from "../domain/errors.js";
import { InMemoryDeliveryQueue } from "./test-utils/in-memory-delivery-queue.js";
import { InMemoryDeliveryRepository } from "./test-utils/in-memory-delivery-repository.js";

async function buildScenario() {
  const classRepository = new InMemoryClassRepository();
  const studentRepository = new InMemoryStudentRepository();
  const userClassRepository = new InMemoryUserClassRepository();
  const learningProfileRepository = new InMemoryLearningProfileRepository([
    { id: "profile-1", name: "Simplificado", prompt: {} },
    { id: "profile-2", name: "Microtarefas", prompt: {} },
  ]);
  const userLearningProfileRepository = new InMemoryUserLearningProfileRepository(learningProfileRepository);
  const listClassStudents = new ListClassStudents(
    classRepository,
    userClassRepository,
    studentRepository,
    userLearningProfileRepository,
  );
  const homeworkRepository = new InMemoryHomeworkRepository();
  const deliveryRepository = new InMemoryDeliveryRepository();
  const deliveryQueue = new InMemoryDeliveryQueue();
  const createDelivery = new CreateDelivery(homeworkRepository, listClassStudents, deliveryRepository, deliveryQueue);

  const createdClass = await classRepository.create({
    name: "Turma A",
    schoolId: "school-1",
    gradeId: "grade-1",
    teacherId: "teacher-1",
  });
  const generator = await homeworkRepository.createGenerator({
    title: "Frações",
    content: "Texto",
    classId: createdClass.id,
    teacherId: "teacher-1",
  });

  const studentWithVariant = await studentRepository.create({ name: "Lucas", email: "lucas@escola.com" });
  const studentWithoutVariant = await studentRepository.create({ name: "Ana", email: "ana@escola.com" });
  const studentWithoutProfile = await studentRepository.create({ name: "João", email: "joao@escola.com" });

  await userClassRepository.create(createdClass.id, studentWithVariant.id);
  await userClassRepository.create(createdClass.id, studentWithoutVariant.id);
  await userClassRepository.create(createdClass.id, studentWithoutProfile.id);

  await userLearningProfileRepository.replaceForUser(studentWithVariant.id, "profile-1");
  await userLearningProfileRepository.replaceForUser(studentWithoutVariant.id, "profile-2");

  await homeworkRepository.upsertAdaptation({
    title: "Frações (P1)",
    content: "Texto simplificado.",
    glossary: null,
    homeworkId: generator.id,
    learningProfileId: "profile-1",
    classId: createdClass.id,
    teacherId: "teacher-1",
  });

  return {
    createdClass,
    generator,
    studentWithVariant,
    studentWithoutVariant,
    studentWithoutProfile,
    createDelivery,
    deliveryQueue,
    deliveryRepository,
    homeworkRepository,
  };
}

describe("CreateDelivery", () => {
  it("cria destinatários pendentes para alunos com variante pronta e enfileira só esses", async () => {
    const { generator, createDelivery, deliveryQueue, studentWithVariant, studentWithoutVariant } =
      await buildScenario();

    const result = await createDelivery.execute({ homeworkId: generator.id, teacherId: "teacher-1" });

    expect(result.enqueuedCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(deliveryQueue.enqueued).toHaveLength(1);

    const pending = result.delivery.recipients.find((r) => r.studentId === studentWithVariant.id);
    expect(pending?.status).toBe("pendente");

    const failed = result.delivery.recipients.find((r) => r.studentId === studentWithoutVariant.id);
    expect(failed?.status).toBe("falhou");
    expect(failed?.failedReason).toContain("Microtarefas");
  });

  it("não inclui alunos sem perfil de aprendizagem vinculado", async () => {
    const { generator, createDelivery, studentWithoutProfile } = await buildScenario();

    const result = await createDelivery.execute({ homeworkId: generator.id, teacherId: "teacher-1" });

    expect(result.delivery.recipients.some((r) => r.studentId === studentWithoutProfile.id)).toBe(false);
  });

  it("rejeita quando a homework é uma variante, não geradora", async () => {
    const { generator, createDelivery, homeworkRepository } = await buildScenario();
    const variant = homeworkRepository.homeworks.find((h) => h.homeworkId === generator.id);
    if (!variant) throw new Error("variante não encontrada no cenário de teste");

    await expect(
      createDelivery.execute({ homeworkId: variant.id, teacherId: "teacher-1" }),
    ).rejects.toBeInstanceOf(HomeworkNotGeneratorError);
  });

  it("rejeita quando não há nenhum aluno com perfil vinculado na turma", async () => {
    const classRepository = new InMemoryClassRepository();
    const studentRepository = new InMemoryStudentRepository();
    const userClassRepository = new InMemoryUserClassRepository();
    const userLearningProfileRepository = new InMemoryUserLearningProfileRepository();
    const listClassStudents = new ListClassStudents(
      classRepository,
      userClassRepository,
      studentRepository,
      userLearningProfileRepository,
    );
    const homeworkRepository = new InMemoryHomeworkRepository();
    const deliveryRepository = new InMemoryDeliveryRepository();
    const deliveryQueue = new InMemoryDeliveryQueue();
    const createDelivery = new CreateDelivery(
      homeworkRepository,
      listClassStudents,
      deliveryRepository,
      deliveryQueue,
    );

    const createdClass = await classRepository.create({
      name: "Turma vazia",
      schoolId: "school-1",
      gradeId: "grade-1",
      teacherId: "teacher-1",
    });
    const generator = await homeworkRepository.createGenerator({
      title: "Frações",
      content: "Texto",
      classId: createdClass.id,
      teacherId: "teacher-1",
    });

    await expect(
      createDelivery.execute({ homeworkId: generator.id, teacherId: "teacher-1" }),
    ).rejects.toBeInstanceOf(NoRecipientsToDeliverError);
  });
});
