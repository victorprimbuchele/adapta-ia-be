import { Router } from "express";

import { authenticate } from "../../../../shared/auth/authenticate.js";
import { asyncHandler } from "../../../../shared/http/async-handler.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { ListGrades } from "../../application/list-grades.js";
import { PrismaGradeRepository } from "../persistence/prisma-grade-repository.js";
import { GradeController } from "./grade.controller.js";

const gradeRepository = new PrismaGradeRepository(prisma);
const listGrades = new ListGrades(gradeRepository);
const gradeController = new GradeController(listGrades);

export const gradeRouter = Router();

gradeRouter.get("/", authenticate, asyncHandler(gradeController.list));
