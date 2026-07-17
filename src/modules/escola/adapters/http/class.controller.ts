import type { Request, Response } from "express";

import { getAuthenticatedUser } from "../../../../shared/auth/authenticate.js";
import type { CreateClass } from "../../application/create-class.js";
import { createClassSchema } from "./create-class.dto.js";

export class ClassController {
  constructor(private readonly createClass: CreateClass) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const { name, schoolId, gradeId } = createClassSchema.parse(req.body);
    const { sub: teacherId } = getAuthenticatedUser(req);

    const createdClass = await this.createClass.execute({
      name,
      schoolId,
      gradeId,
      teacherId,
    });

    res.status(201).json(createdClass);
  };
}
