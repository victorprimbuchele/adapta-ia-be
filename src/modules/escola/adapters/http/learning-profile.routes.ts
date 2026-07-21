import { Router } from "express";

import { authenticate } from "../../../../shared/auth/authenticate.js";
import { asyncHandler } from "../../../../shared/http/async-handler.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { ListLearningProfiles } from "../../application/list-learning-profiles.js";
import { PrismaLearningProfileRepository } from "../persistence/prisma-learning-profile-repository.js";
import { LearningProfileController } from "./learning-profile.controller.js";

const learningProfileRepository = new PrismaLearningProfileRepository(prisma);
const listLearningProfiles = new ListLearningProfiles(learningProfileRepository);
const learningProfileController = new LearningProfileController(listLearningProfiles);

export const learningProfileRouter = Router();

learningProfileRouter.get("/", authenticate, asyncHandler(learningProfileController.list));
