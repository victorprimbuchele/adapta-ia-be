import { Router } from "express";

import { authenticate } from "../../../../shared/auth/authenticate.js";
import { RedisIdempotency } from "../../../../shared/adapters/redis-idempotency.js";
import { asyncHandler } from "../../../../shared/http/async-handler.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { PrismaClassRepository } from "../../../escola/adapters/persistence/prisma-class-repository.js";
import { PrismaLearningProfileRepository } from "../../../escola/adapters/persistence/prisma-learning-profile-repository.js";
import { PrismaStudentRepository } from "../../../escola/adapters/persistence/prisma-student-repository.js";
import { PrismaUserClassRepository } from "../../../escola/adapters/persistence/prisma-user-class-repository.js";
import { PrismaUserLearningProfileRepository } from "../../../escola/adapters/persistence/prisma-user-learning-profile-repository.js";
import { ListClassStudents } from "../../../escola/application/list-class-students.js";
import { CreateDelivery } from "../../../entrega/application/create-delivery.js";
import { BullMqDeliveryQueue } from "../../../entrega/adapters/queue/bullmq-delivery-queue.js";
import { PrismaDeliveryRepository } from "../../../entrega/adapters/persistence/prisma-delivery-repository.js";
import { CreateGeneratorHomework } from "../../application/create-generator-homework.js";
import { EnqueueHomeworkAdaptation } from "../../application/enqueue-homework-adaptation.js";
import { GetHomeworkAdaptationStatus } from "../../application/get-homework-adaptation-status.js";
import { GetHomeworkDetail } from "../../application/get-homework-detail.js";
import { UpdateDraftHomework } from "../../application/update-draft-homework.js";
import { PrismaHomeworkRepository } from "../persistence/prisma-homework-repository.js";
import { PrismaTeacherRepository } from "../persistence/prisma-teacher-repository.js";
import { BullMqAdaptationJobStatus } from "../queue/bullmq-adaptation-job-status.js";
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
const studentRepository = new PrismaStudentRepository(prisma);
const adaptationQueue = new BullMqAdaptationQueue();
const adaptationJobStatus = new BullMqAdaptationJobStatus();
const idempotency = new RedisIdempotency();
const listClassStudents = new ListClassStudents(
  classRepository,
  userClassRepository,
  studentRepository,
  userLearningProfileRepository,
);
const deliveryRepository = new PrismaDeliveryRepository(prisma);
const deliveryQueue = new BullMqDeliveryQueue();
const createDelivery = new CreateDelivery(
  homeworkRepository,
  listClassStudents,
  deliveryRepository,
  deliveryQueue,
);

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
const getHomeworkAdaptationStatus = new GetHomeworkAdaptationStatus(
  homeworkRepository,
  learningProfileRepository,
  adaptationJobStatus,
);
const homeworkController = new HomeworkController(
  createGeneratorHomework,
  updateDraftHomework,
  getHomeworkDetail,
  enqueueHomeworkAdaptation,
  getHomeworkAdaptationStatus,
  createDelivery,
);

export const homeworkRouter = Router();

homeworkRouter.post(
  "/",
  authenticate,
  asyncHandler(homeworkController.create),
);

homeworkRouter.get(
  "/:id/status-adaptacao",
  authenticate,
  asyncHandler(homeworkController.adaptationStatus),
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

homeworkRouter.post(
  "/:id/enviar",
  authenticate,
  asyncHandler(homeworkController.send),
);
