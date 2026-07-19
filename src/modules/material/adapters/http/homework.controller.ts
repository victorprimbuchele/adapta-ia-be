import type { Request, Response } from "express";

import { getAuthenticatedUser } from "../../../../shared/auth/authenticate.js";
import type { CreateGeneratorHomework } from "../../application/create-generator-homework.js";
import type { GetHomeworkDetail } from "../../application/get-homework-detail.js";
import type { UpdateDraftHomework } from "../../application/update-draft-homework.js";
import { createHomeworkSchema } from "./create-homework.dto.js";
import { updateHomeworkSchema } from "./update-homework.dto.js";

export class HomeworkController {
  constructor(
    private readonly createGeneratorHomework: CreateGeneratorHomework,
    private readonly updateDraftHomework: UpdateDraftHomework,
    private readonly getHomeworkDetail: GetHomeworkDetail,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    // Validates the full structured form (BE-E4.2). The generator still
    // persists title + main content; question, subject and class are required
    // at the boundary and reject incomplete payloads with clear errors.
    const { title, content } = createHomeworkSchema.parse(req.body);
    const { sub: teacherId } = getAuthenticatedUser(req);

    const homework = await this.createGeneratorHomework.execute({
      title,
      content,
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
}
