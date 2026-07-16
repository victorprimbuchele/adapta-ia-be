import type { Request, Response } from "express";

import type { ListGrades } from "../../application/list-grades.js";

export class GradeController {
  constructor(private readonly listGrades: ListGrades) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const grades = await this.listGrades.execute();

    res.status(200).json(grades);
  };
}
