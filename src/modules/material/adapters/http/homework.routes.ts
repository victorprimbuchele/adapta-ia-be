import { Router } from "express";

import { authenticate } from "../../../../shared/auth/authenticate.js";
import { asyncHandler } from "../../../../shared/http/async-handler.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { CreateGeneratorHomework } from "../../application/create-generator-homework.js";
import { PrismaHomeworkRepository } from "../persistence/prisma-homework-repository.js";
import { PrismaTeacherRepository } from "../persistence/prisma-teacher-repository.js";
import { HomeworkController } from "./homework.controller.js";

const homeworkRepository = new PrismaHomeworkRepository(prisma);
const teacherRepository = new PrismaTeacherRepository(prisma);
const createGeneratorHomework = new CreateGeneratorHomework(
  homeworkRepository,
  teacherRepository,
);
const homeworkController = new HomeworkController(createGeneratorHomework);

export const homeworkRouter = Router();

homeworkRouter.post(
  "/",
  authenticate,
  asyncHandler(homeworkController.create),
);
