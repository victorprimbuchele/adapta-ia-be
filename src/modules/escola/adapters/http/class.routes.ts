import { Router } from "express";

import { authenticate } from "../../../../shared/auth/authenticate.js";
import { asyncHandler } from "../../../../shared/http/async-handler.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { CreateClass } from "../../application/create-class.js";
import { DeleteClass } from "../../application/delete-class.js";
import { EnrollStudent } from "../../application/enroll-student.js";
import { GetClassDetail } from "../../application/get-class-detail.js";
import { ListClasses } from "../../application/list-classes.js";
import { ListClassStudents } from "../../application/list-class-students.js";
import { RemoveStudentFromClass } from "../../application/remove-student-from-class.js";
import { PrismaClassRepository } from "../persistence/prisma-class-repository.js";
import { PrismaGradeRepository } from "../persistence/prisma-grade-repository.js";
import { PrismaSchoolRepository } from "../persistence/prisma-school-repository.js";
import { PrismaStudentRepository } from "../persistence/prisma-student-repository.js";
import { PrismaTeacherRepository } from "../persistence/prisma-teacher-repository.js";
import { PrismaUserClassRepository } from "../persistence/prisma-user-class-repository.js";
import { PrismaUserLearningProfileRepository } from "../persistence/prisma-user-learning-profile-repository.js";
import { ClassController } from "./class.controller.js";

const classRepository = new PrismaClassRepository(prisma);
const schoolRepository = new PrismaSchoolRepository(prisma);
const gradeRepository = new PrismaGradeRepository(prisma);
const teacherRepository = new PrismaTeacherRepository(prisma);
const studentRepository = new PrismaStudentRepository(prisma);
const userClassRepository = new PrismaUserClassRepository(prisma);
const userLearningProfileRepository = new PrismaUserLearningProfileRepository(
  prisma,
);
const createClass = new CreateClass(
  classRepository,
  schoolRepository,
  gradeRepository,
  teacherRepository,
);
const listClasses = new ListClasses(classRepository);
const getClassDetail = new GetClassDetail(classRepository);
const deleteClass = new DeleteClass(classRepository);
const enrollStudent = new EnrollStudent(
  classRepository,
  studentRepository,
  userClassRepository,
);
const listClassStudents = new ListClassStudents(
  classRepository,
  userClassRepository,
  studentRepository,
  userLearningProfileRepository,
);
const removeStudentFromClass = new RemoveStudentFromClass(
  classRepository,
  userClassRepository,
);
const classController = new ClassController(
  createClass,
  listClasses,
  getClassDetail,
  deleteClass,
  enrollStudent,
  listClassStudents,
  removeStudentFromClass,
);

export const classRouter = Router();

classRouter.post("/", authenticate, asyncHandler(classController.create));
classRouter.get("/", authenticate, asyncHandler(classController.list));
classRouter.get("/:id", authenticate, asyncHandler(classController.show));
classRouter.delete("/:id", authenticate, asyncHandler(classController.remove));
classRouter.get(
  "/:id/alunos",
  authenticate,
  asyncHandler(classController.listStudents),
);
classRouter.post(
  "/:id/alunos",
  authenticate,
  asyncHandler(classController.enroll),
);
classRouter.delete(
  "/:id/alunos/:alunoId",
  authenticate,
  asyncHandler(classController.removeStudent),
);
