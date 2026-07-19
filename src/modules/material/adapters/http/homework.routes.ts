import { Router } from "express";

import { authenticate } from "../../../../shared/auth/authenticate.js";
import { RedisIdempotency } from "../../../../shared/adapters/redis-idempotency.js";
import { asyncHandler } from "../../../../shared/http/async-handler.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { PrismaClassRepository } from "../../../escola/adapters/persistence/prisma-class-repository.js";
import { PrismaLearningProfileRepository } from "../../../escola/adapters/persistence/prisma-learning-profile-repository.js";
import { PrismaUserClassRepository } from "../../../escola/adapters/persistence/prisma-user-class-repository.js";
import { PrismaUserLearningProfileRepository } from "../../../escola/adapters/persistence/prisma-user-learning-profile-repository.js";
import { CreateGeneratorHomework } from "../../application/create-generator-homework.js";
import { EnqueueHomeworkAdaptation } from "../../application/enqueue-homework-adaptation.js";
import { GetHomeworkDetail } from "../../application/get-homework-detail.js";
import { UpdateDraftHomework } from "../../application/update-draft-homework.js";
import { PrismaHomeworkRepository } from "../persistence/prisma-homework-repository.js";
import { PrismaTeacherRepository } from "../persistence/prisma-teacher-repository.js";
import { BullMqAdaptationQueue } from "../queue/bullmq-adaptation-queue.js";
import { HomeworkController } from "./homework.controller.js";

const homeworkRepository = new PrismaHomeworkRepository(prisma);
const teacherRepository = new PrismaTeacherRepository(prisma);
const classRepository = new PrismaClassRepository(prisma);
const userClassRepository = new PrismaUserClassRepository(prisma);
const userLearningProfileRepository = new PrismaUserLearningProfileRepository(
  prisma,
);
const learningProfileRepository = new PrismaLearningProfileRepository(prisma);
const adaptationQueue = new BullMqAdaptationQueue();
const idempotency = new RedisIdempotency();

const createGeneratorHomework = new CreateGeneratorHomework(
  homeworkRepository,
  teacherRepository,
  classRepository,
);
const updateDraftHomework = new UpdateDraftHomework(homeworkRepository);
const getHomeworkDetail = new GetHomeworkDetail(homeworkRepository);
const enqueueHomeworkAdaptation = new EnqueueHomeworkAdaptation(
  homeworkRepository,
  userClassRepository,
  userLearningProfileRepository,
  learningProfileRepository,
  adaptationQueue,
  idempotency,
);
const homeworkController = new HomeworkController(
  createGeneratorHomework,
  updateDraftHomework,
  getHomeworkDetail,
  enqueueHomeworkAdaptation,
);

export const homeworkRouter = Router();

homeworkRouter.post(
  "/",
  authenticate,
  asyncHandler(homeworkController.create),
);

homeworkRouter.get(
  "/:id",
  authenticate,
  asyncHandler(homeworkController.show),
);

homeworkRouter.patch(
  "/:id",
  authenticate,
  asyncHandler(homeworkController.update),
);

homeworkRouter.post(
  "/:id/adaptar",
  authenticate,
  asyncHandler(homeworkController.adapt),
);
