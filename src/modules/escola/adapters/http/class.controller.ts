import type { Request, Response } from "express";

import { getAuthenticatedUser } from "../../../../shared/auth/authenticate.js";
import type { CreateClass } from "../../application/create-class.js";
import type { ListClasses } from "../../application/list-classes.js";
import { createClassSchema } from "./create-class.dto.js";

export class ClassController {
  constructor(
    private readonly createClass: CreateClass,
    private readonly listClasses: ListClasses,
  ) {}

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

  list = async (req: Request, res: Response): Promise<void> => {
    const { sub: teacherId } = getAuthenticatedUser(req);

    const classes = await this.listClasses.execute(teacherId);

    res.status(200).json(classes);
  };
}
