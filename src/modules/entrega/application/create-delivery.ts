import type { ListClassStudents } from "../../escola/application/list-class-students.js";
import type { ClassStudentWithProfile } from "../../escola/domain/student.js";
import type { LearningProfile } from "../../escola/domain/learning-profile.js";
import { authorizeHomeworkOwner } from "../../material/application/authorize-homework-owner.js";
import { HomeworkNotGeneratorError } from "../../material/domain/errors.js";
import type { HomeworkRepository } from "../../material/ports/homework-repository.js";
import type { DeliveryDetail } from "../domain/delivery.js";
import { NoRecipientsToDeliverError } from "../domain/errors.js";
import type { CreateRecipientData, DeliveryRepository } from "../ports/delivery-repository.js";
import type { DeliveryQueuePort } from "../ports/delivery-queue.js";

export interface CreateDeliveryInput {
  homeworkId: string;
  teacherId: string;
}

export interface CreateDeliveryResult {
  delivery: DeliveryDetail;
  enqueuedCount: number;
  skippedCount: number;
}

/**
 * Cria um envio: um destinatário por aluno matriculado na turma com
 * perfil de aprendizagem vinculado, usando a variante adaptada
 * correspondente (Épico 6, BE-E6.1). Alunos cujo perfil não tem variante
 * pronta entram como `falhou` imediatamente (sem job) — visível na tela
 * de status sem travar os que podem ser enviados.
 */
export class CreateDelivery {
  constructor(
    private readonly homeworkRepository: HomeworkRepository,
    private readonly listClassStudents: ListClassStudents,
    private readonly deliveryRepository: DeliveryRepository,
    private readonly deliveryQueue: DeliveryQueuePort,
  ) {}

  async execute(input: CreateDeliveryInput): Promise<CreateDeliveryResult> {
    const homework = await authorizeHomeworkOwner(
      this.homeworkRepository,
      input.homeworkId,
      input.teacherId,
    );

    if (homework.homeworkId !== null) {
      throw new HomeworkNotGeneratorError(input.homeworkId);
    }

    const [variants, students] = await Promise.all([
      this.homeworkRepository.findAdaptationsByHomeworkId(homework.id),
      this.listClassStudents.execute(homework.classId, input.teacherId),
    ]);

    const studentsWithProfile = students.filter(
      (student): student is ClassStudentWithProfile & { learningProfile: LearningProfile } =>
        student.learningProfile !== null,
    );

    if (studentsWithProfile.length === 0) {
      throw new NoRecipientsToDeliverError(input.homeworkId);
    }

    const variantByProfileId = new Map(
      variants.filter((v) => v.learningProfileId !== null).map((v) => [v.learningProfileId as string, v]),
    );

    const recipients: CreateRecipientData[] = studentsWithProfile.map((student) => {
      const profileId = student.learningProfile.id;
      const variant = variantByProfileId.get(profileId);

      if (!variant) {
        return {
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          variantHomeworkId: null,
          status: "falhou" as const,
          failedReason: `Adaptação não disponível para o perfil "${student.learningProfile.name}".`,
        };
      }

      return {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        variantHomeworkId: variant.id,
        status: "pendente" as const,
        failedReason: null,
      };
    });

    const delivery = await this.deliveryRepository.create({
      homeworkId: homework.id,
      teacherId: input.teacherId,
      recipients,
    });

    const pendingRecipients = delivery.recipients.filter((r) => r.status === "pendente");

    await this.deliveryQueue.enqueue(
      pendingRecipients.map((r) => ({ deliveryId: delivery.id, recipientId: r.id })),
    );

    return {
      delivery,
      enqueuedCount: pendingRecipients.length,
      skippedCount: recipients.length - pendingRecipients.length,
    };
  }
}
