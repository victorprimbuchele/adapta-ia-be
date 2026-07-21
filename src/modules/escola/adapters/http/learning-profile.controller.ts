import type { Request, Response } from "express";

import type { ListLearningProfiles } from "../../application/list-learning-profiles.js";

export class LearningProfileController {
  constructor(private readonly listLearningProfiles: ListLearningProfiles) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const profiles = await this.listLearningProfiles.execute();

    res.status(200).json(profiles);
  };
}
