import { Router } from "express";

import { authenticate } from "../../../../shared/auth/authenticate.js";
import { asyncHandler } from "../../../../shared/http/async-handler.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { ListSchools } from "../../application/list-schools.js";
import { PrismaSchoolRepository } from "../persistence/prisma-school-repository.js";
import { SchoolController } from "./school.controller.js";

const schoolRepository = new PrismaSchoolRepository(prisma);
const listSchools = new ListSchools(schoolRepository);
const schoolController = new SchoolController(listSchools);

export const schoolRouter = Router();

schoolRouter.get("/", authenticate, asyncHandler(schoolController.list));
