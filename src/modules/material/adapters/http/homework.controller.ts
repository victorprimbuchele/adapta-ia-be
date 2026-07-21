import type { Request, Response } from "express";

import { getAuthenticatedUser } from "../../../../shared/auth/authenticate.js";
import type { CreateDelivery } from "../../../entrega/application/create-delivery.js";
import type { CreateGeneratorHomework } from "../../application/create-generator-homework.js";
import type { EnqueueHomeworkAdaptation } from "../../application/enqueue-homework-adaptation.js";
import type { GetHomeworkAdaptationStatus } from "../../application/get-homework-adaptation-status.js";
import type { GetHomeworkDetail } from "../../application/get-homework-detail.js";
import type { UpdateDraftHomework } from "../../application/update-draft-homework.js";
import { adaptHomeworkSchema } from "./adapt-homework.dto.js";
import { createHomeworkSchema } from "./create-homework.dto.js";
import { updateHomeworkSchema } from "./update-homework.dto.js";

export class HomeworkController {
  constructor(
    private readonly createGeneratorHomework: CreateGeneratorHomework,
    private readonly updateDraftHomework: UpdateDraftHomework,
    private readonly getHomeworkDetail: GetHomeworkDetail,
    private readonly enqueueHomeworkAdaptation: EnqueueHomeworkAdaptation,
    private readonly getHomeworkAdaptationStatus: GetHomeworkAdaptationStatus,
    private readonly createDelivery: CreateDelivery,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    // Validates the full structured form (BE-E4.2). Persists title, main
    // content and class; question and subject are required at the boundary
    // and reject incomplete payloads with clear errors.
    const { title, content, classId } = createHomeworkSchema.parse(req.body);
    const { sub: teacherId } = getAuthenticatedUser(req);

    const homework = await this.createGeneratorHomework.execute({
      title,
      content,
      classId,
      teacherId,
    });

    res.status(201).json(homework);
  };

  show = async (req: Request, res: Response): Promise<void> => {
    // Returns generator homework with linked adaptations (BE-E4.4).
    const id = req.params["id"] as string;
    const { sub: teacherId } = getAuthenticatedUser(req);

    const homeworkDetail = await this.getHomeworkDetail.execute(id, teacherId);

    res.status(200).json(homeworkDetail);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    // Saves draft changes only (BE-E4.3). Does not generate adaptations.
    const id = req.params["id"] as string;
    const { title, content } = updateHomeworkSchema.parse(req.body);
    const { sub: teacherId } = getAuthenticatedUser(req);

    const homework = await this.updateDraftHomework.execute({
      homeworkId: id,
      teacherId,
      title,
      content,
    });

    res.status(200).json(homework);
  };

  adapt = async (req: Request, res: Response): Promise<void> => {
    // Enqueues adaptation jobs and returns immediately (BE-E5.1).
    const id = req.params["id"] as string;
    const { learningProfileIds } = adaptHomeworkSchema.parse(req.body ?? {});
    const { sub: teacherId } = getAuthenticatedUser(req);

    const result = await this.enqueueHomeworkAdaptation.execute({
      homeworkId: id,
      teacherId,
      learningProfileIds,
    });

    res.status(202).json(result);
  };

  adaptationStatus = async (req: Request, res: Response): Promise<void> => {
    // Polling de status da adaptação (BE-E5.9).
    const id = req.params["id"] as string;
    const { sub: teacherId } = getAuthenticatedUser(req);

    const result = await this.getHomeworkAdaptationStatus.execute(
      id,
      teacherId,
    );

    res.status(200).json(result);
  };

  send = async (req: Request, res: Response): Promise<void> => {
    // Cria o envio e enfileira os e-mails, retorna imediatamente (BE-E6.1).
    const id = req.params["id"] as string;
    const { sub: teacherId } = getAuthenticatedUser(req);

    const result = await this.createDelivery.execute({ homeworkId: id, teacherId });

    res.status(202).json({
      deliveryId: result.delivery.id,
      enqueuedCount: result.enqueuedCount,
      skippedCount: result.skippedCount,
    });
  };
}
