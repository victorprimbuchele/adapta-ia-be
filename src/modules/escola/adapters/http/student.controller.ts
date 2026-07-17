import type { Request, Response } from "express";

import type { AssignLearningProfile } from "../../application/assign-learning-profile.js";
import { assignLearningProfileSchema } from "./assign-learning-profile.dto.js";

export class StudentController {
  constructor(private readonly assignLearningProfile: AssignLearningProfile) {}

  assignProfile = async (req: Request, res: Response): Promise<void> => {
    const { learningProfileId } = assignLearningProfileSchema.parse(req.body);
    const studentId = req.params["id"] as string;

    const link = await this.assignLearningProfile.execute({
      studentId,
      learningProfileId,
    });

    res.status(200).json(link);
  };
}
