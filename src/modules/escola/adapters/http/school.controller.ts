import type { Request, Response } from "express";

import type { ListSchools } from "../../application/list-schools.js";

export class SchoolController {
  constructor(private readonly listSchools: ListSchools) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const schools = await this.listSchools.execute();

    res.status(200).json(schools);
  };
}
