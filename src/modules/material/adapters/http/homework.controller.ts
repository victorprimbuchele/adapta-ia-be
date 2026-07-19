import type { Request, Response } from "express";

import { getAuthenticatedUser } from "../../../../shared/auth/authenticate.js";
import type { CreateGeneratorHomework } from "../../application/create-generator-homework.js";
import { createHomeworkSchema } from "./create-homework.dto.js";

export class HomeworkController {
  constructor(
    private readonly createGeneratorHomework: CreateGeneratorHomework,
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
}
