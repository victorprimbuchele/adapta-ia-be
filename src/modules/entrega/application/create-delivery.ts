import type { ListClassStudents } from "../../escola/application/list-class-students.js";
import type { LearningProfileRepository } from "../../escola/ports/learning-profile-repository.js";
import type { ClassStudentWithProfile } from "../../escola/domain/student.js";
import type { LearningProfile } from "../../escola/domain/learning-profile.js";
import { authorizeHomeworkOwner } from "../../material/application/authorize-homework-owner.js";
import { HomeworkNotGeneratorError } from "../../material/domain/errors.js";
import type { HomeworkRepository } from "../../material/ports/homework-repository.js";
import type { DeliveryDetail } from "../domain/delivery.js";
import {
  IncompleteDeliveryVariantsError,
  NoRecipientsToDeliverError,
} from "../domain/errors.js";
import type { CreateRecipientData, DeliveryRepository } from "../ports/delivery-repository.js";
import type { DeliveryQueuePort } from "../ports/delivery-queue.js";
import { findMissingDeliveryProfiles } from "./find-missing-delivery-profiles.js";
import { buildEmailSendingSnapshot } from "./build-email-sending-snapshot.js";
import {
  indexVariantsByLearningProfileId,
  resolveDeliveryVariantForProfile,
} from "./resolve-delivery-variant-for-profile.js";

export interface CreateDeliveryInput {
  homeworkId: string;
  teacherId: string;
}

export interface CreateDeliveryResult {
  delivery: DeliveryDetail;
  enqueuedCount: number;
}

/**
 * Cria um envio (`Sending` / `Delivery`, status inicial `agendado`): para
 * cada aluno, seleciona a variante do seu perfil ativo (BE-E7.3) e cria
 * HomeworkSending + EmailSending via `DeliveryRecipient` (BE-E7.2), com
 * snapshot de e-mail e payload (BE-E7.4). Bloqueia se faltar variante
 * pronta para algum perfil (BE-E7.1).
 */
export class CreateDelivery {
  constructor(
    private readonly homeworkRepository: HomeworkRepository,
    private readonly learningProfileRepository: LearningProfileRepository,
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

    const missingProfiles = await findMissingDeliveryProfiles({
      studentsWithProfile,
      variants,
      learningProfileRepository: this.learningProfileRepository,
    });

    if (missingProfiles.length > 0) {
      throw new IncompleteDeliveryVariantsError(input.homeworkId, missingProfiles);
    }

    const variantsByProfileId = indexVariantsByLearningProfileId(variants);

    const recipients: CreateRecipientData[] = studentsWithProfile.map((student) => {
      const variant = resolveDeliveryVariantForProfile(
        student.learningProfile.id,
        variantsByProfileId,
      )!;

      return {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        emailPayload: buildEmailSendingSnapshot(variant),
        variantHomeworkId: variant.id,
        status: "pendente" as const,
        failedReason: null,
      };
    });

    const delivery = await this.deliveryRepository.create({
      homeworkId: homework.id,
      teacherId: input.teacherId,
      status: "agendado",
      recipients,
    });

    await this.deliveryQueue.enqueue(
      delivery.recipients.map((recipient) => ({
        deliveryId: delivery.id,
        recipientId: recipient.id,
      })),
    );

    return {
      delivery,
      enqueuedCount: delivery.recipients.length,
    };
  }
}
