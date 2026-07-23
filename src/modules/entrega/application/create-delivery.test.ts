import type { LearningProfile } from "../../escola/domain/learning-profile.js";
import { CreateDelivery } from "./create-delivery.js";
import { ListClassStudents } from "../../escola/application/list-class-students.js";
import { InMemoryClassRepository } from "../../escola/application/test-utils/in-memory-class-repository.js";
import { InMemoryStudentRepository } from "../../escola/application/test-utils/in-memory-student-repository.js";
import { InMemoryUserClassRepository } from "../../escola/application/test-utils/in-memory-user-class-repository.js";
import { InMemoryUserLearningProfileRepository } from "../../escola/application/test-utils/in-memory-user-learning-profile-repository.js";
import { InMemoryLearningProfileRepository } from "../../escola/application/test-utils/in-memory-learning-profile-repository.js";
import { InMemoryHomeworkRepository } from "../../material/application/test-utils/in-memory-homework-repository.js";
import { HomeworkNotGeneratorError } from "../../material/domain/errors.js";
import {
  IncompleteDeliveryVariantsError,
  NoRecipientsToDeliverError,
} from "../domain/errors.js";
import { InMemoryDeliveryQueue } from "./test-utils/in-memory-delivery-queue.js";
import { InMemoryDeliveryRepository } from "./test-utils/in-memory-delivery-repository.js";

const PROFILE_1: LearningProfile = {
  id: "profile-1",
  name: "Simplificado",
  prompt: {
    code: "P1",
    kind: "base",
    combines: ["P1"],
    adaptations: {
      simplifyText: true,
      glossary: false,
      tts: false,
      microtasks: false,
      visualStructure: false,
      highContrast: false,
      largeFont: false,
      screenReader: false,
    },
    instructions: "Simplifique.",
  },
};

const PROFILE_2: LearningProfile = {
  id: "profile-2",
  name: "Microtarefas",
  prompt: {
    code: "P2",
    kind: "base",
    combines: ["P2"],
    adaptations: {
      simplifyText: true,
      glossary: false,
      tts: false,
      microtasks: true,
      visualStructure: false,
      highContrast: false,
      largeFont: false,
      screenReader: false,
    },
    instructions: "Fragmente em microtarefas.",
  },
};

async function buildScenario() {
  const classRepository = new InMemoryClassRepository();
  const studentRepository = new InMemoryStudentRepository();
  const userClassRepository = new InMemoryUserClassRepository();
  const learningProfileRepository = new InMemoryLearningProfileRepository([
    PROFILE_1,
    PROFILE_2,
  ]);
  const userLearningProfileRepository = new InMemoryUserLearningProfileRepository(
    learningProfileRepository,
  );
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
    learningProfileRepository,
    listClassStudents,
    deliveryRepository,
    deliveryQueue,
  );

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

  const variantProfile1 = await homeworkRepository.upsertAdaptation({
    title: "Frações (P1)",
    content: "Texto simplificado.",
    glossary: null,
    homeworkId: generator.id,
    learningProfileId: "profile-1",
    classId: createdClass.id,
    teacherId: "teacher-1",
  });
  await homeworkRepository.attachContentFile(variantProfile1.id, "file-pdf-1");

  return {
    createdClass,
    generator,
    variantProfile1,
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
  it("bloqueia envio quando falta variante pronta para algum perfil da turma", async () => {
    const { generator, createDelivery, deliveryQueue } = await buildScenario();

    await expect(
      createDelivery.execute({ homeworkId: generator.id, teacherId: "teacher-1" }),
    ).rejects.toMatchObject({
      code: "INCOMPLETE_DELIVERY_VARIANTS",
      missingProfiles: [{ id: "profile-2", name: "Microtarefas" }],
    });

    expect(deliveryQueue.enqueued).toHaveLength(0);
  });

  it("cria um HomeworkSending e um EmailSending por aluno com a variante do perfil (BE-E7.2)", async () => {
    const {
      generator,
      variantProfile1,
      createDelivery,
      homeworkRepository,
      createdClass,
      studentWithVariant,
      studentWithoutVariant,
    } = await buildScenario();

    const variantProfile2 = await homeworkRepository.upsertAdaptation({
      title: "Frações (P2)",
      content: "Texto em microtarefas.",
      glossary: null,
      homeworkId: generator.id,
      learningProfileId: "profile-2",
      classId: createdClass.id,
      teacherId: "teacher-1",
    });
    await homeworkRepository.attachContentFile(variantProfile2.id, "file-pdf-2");

    const result = await createDelivery.execute({ homeworkId: generator.id, teacherId: "teacher-1" });

    expect(result.delivery.recipients).toHaveLength(2);

    const lucas = result.delivery.recipients.find((r) => r.studentId === studentWithVariant.id)!;
    const ana = result.delivery.recipients.find((r) => r.studentId === studentWithoutVariant.id)!;

    // HomeworkSending: variante do perfil, nunca a geradora
    expect(lucas.variantHomeworkId).toBe(variantProfile1.id);
    expect(ana.variantHomeworkId).toBe(variantProfile2.id);
    expect(lucas.variantHomeworkId).not.toBe(generator.id);
    expect(ana.variantHomeworkId).not.toBe(generator.id);

    // EmailSending: snapshot do e-mail + status inicial pendente
    expect(lucas.studentEmail).toBe("lucas@escola.com");
    expect(ana.studentEmail).toBe("ana@escola.com");
    expect(lucas.status).toBe("pendente");
    expect(ana.status).toBe("pendente");
  });

  it("cria envio agendado com destinatários pendentes quando todas as variantes estão prontas", async () => {
    const {
      generator,
      createDelivery,
      deliveryQueue,
      homeworkRepository,
      createdClass,
      studentWithVariant,
      studentWithoutVariant,
    } = await buildScenario();

    const variantProfile2 = await homeworkRepository.upsertAdaptation({
      title: "Frações (P2)",
      content: "Texto em microtarefas.",
      glossary: null,
      homeworkId: generator.id,
      learningProfileId: "profile-2",
      classId: createdClass.id,
      teacherId: "teacher-1",
    });
    await homeworkRepository.attachContentFile(variantProfile2.id, "file-pdf-2");

    const result = await createDelivery.execute({ homeworkId: generator.id, teacherId: "teacher-1" });

    expect(result.delivery.status).toBe("agendado");
    expect(result.enqueuedCount).toBe(2);
    expect(deliveryQueue.enqueued).toHaveLength(2);
    expect(result.delivery.recipients).toHaveLength(2);
    expect(result.delivery.recipients.every((recipient) => recipient.status === "pendente")).toBe(true);

    const lucas = result.delivery.recipients.find((r) => r.studentId === studentWithVariant.id);
    const ana = result.delivery.recipients.find((r) => r.studentId === studentWithoutVariant.id);
    expect(lucas?.variantHomeworkId).toBeTruthy();
    expect(ana?.variantHomeworkId).toBeTruthy();
  });

  it("não inclui alunos sem perfil de aprendizagem vinculado", async () => {
    const { generator, createDelivery, homeworkRepository, createdClass, studentWithoutProfile } =
      await buildScenario();

    const variantProfile2 = await homeworkRepository.upsertAdaptation({
      title: "Frações (P2)",
      content: "Texto em microtarefas.",
      glossary: null,
      homeworkId: generator.id,
      learningProfileId: "profile-2",
      classId: createdClass.id,
      teacherId: "teacher-1",
    });
    await homeworkRepository.attachContentFile(variantProfile2.id, "file-pdf-2");

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
    const learningProfileRepository = new InMemoryLearningProfileRepository();
    const userLearningProfileRepository = new InMemoryUserLearningProfileRepository(
      learningProfileRepository,
    );
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
      learningProfileRepository,
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

  it("expõe perfis faltantes no erro IncompleteDeliveryVariantsError", async () => {
    const { generator, createDelivery } = await buildScenario();

    try {
      await createDelivery.execute({ homeworkId: generator.id, teacherId: "teacher-1" });
      throw new Error("deveria ter falhado");
    } catch (error) {
      expect(error).toBeInstanceOf(IncompleteDeliveryVariantsError);
      const typed = error as IncompleteDeliveryVariantsError;
      expect(typed.missingProfiles).toEqual([{ id: "profile-2", name: "Microtarefas" }]);
    }
  });
});
