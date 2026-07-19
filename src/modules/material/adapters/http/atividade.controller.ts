import type { Request, Response } from "express";

import { getAuthenticatedUser } from "../../../../shared/auth/authenticate.js";
import type { CreateGeneratorHomework } from "../../application/create-generator-homework.js";
import { createAtividadeSchema } from "./create-atividade.dto.js";

export class AtividadeController {
  constructor(
    private readonly createGeneratorHomework: CreateGeneratorHomework,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const { title, content } = createAtividadeSchema.parse(req.body);
    const { sub: teacherId } = getAuthenticatedUser(req);

    const homework = await this.createGeneratorHomework.execute({
      title,
      content,
      teacherId,
    });

    res.status(201).json(homework);
  };
}
