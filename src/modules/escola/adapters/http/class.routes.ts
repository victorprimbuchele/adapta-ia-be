import { Router } from "express";

import { authenticate } from "../../../../shared/auth/authenticate.js";
import { asyncHandler } from "../../../../shared/http/async-handler.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { CreateClass } from "../../application/create-class.js";
import { PrismaClassRepository } from "../persistence/prisma-class-repository.js";
import { PrismaGradeRepository } from "../persistence/prisma-grade-repository.js";
import { PrismaSchoolRepository } from "../persistence/prisma-school-repository.js";
import { ClassController } from "./class.controller.js";

const classRepository = new PrismaClassRepository(prisma);
const schoolRepository = new PrismaSchoolRepository(prisma);
const gradeRepository = new PrismaGradeRepository(prisma);
const createClass = new CreateClass(
  classRepository,
  schoolRepository,
  gradeRepository,
);
const classController = new ClassController(createClass);

export const classRouter = Router();

classRouter.post("/", authenticate, asyncHandler(classController.create));
