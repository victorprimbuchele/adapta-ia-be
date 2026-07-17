import { Router } from "express";

import { authenticate } from "../../../../shared/auth/authenticate.js";
import { asyncHandler } from "../../../../shared/http/async-handler.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { AssignLearningProfile } from "../../application/assign-learning-profile.js";
import { PrismaLearningProfileRepository } from "../persistence/prisma-learning-profile-repository.js";
import { PrismaStudentRepository } from "../persistence/prisma-student-repository.js";
import { PrismaUserLearningProfileRepository } from "../persistence/prisma-user-learning-profile-repository.js";
import { StudentController } from "./student.controller.js";

const studentRepository = new PrismaStudentRepository(prisma);
const learningProfileRepository = new PrismaLearningProfileRepository(prisma);
const userLearningProfileRepository = new PrismaUserLearningProfileRepository(
  prisma,
);
const assignLearningProfile = new AssignLearningProfile(
  studentRepository,
  learningProfileRepository,
  userLearningProfileRepository,
);
const studentController = new StudentController(assignLearningProfile);

export const studentRouter = Router();

studentRouter.post(
  "/:id/perfil-aprendizagem",
  authenticate,
  asyncHandler(studentController.assignProfile),
);
