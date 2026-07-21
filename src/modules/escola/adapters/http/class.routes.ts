import { Router } from "express";

import { authenticate } from "../../../../shared/auth/authenticate.js";
import { asyncHandler } from "../../../../shared/http/async-handler.js";
import { prisma } from "../../../../shared/infra/prisma-client.js";
import { PrismaHomeworkRepository } from "../../../material/adapters/persistence/prisma-homework-repository.js";
import { ListClassHomeworks } from "../../../material/application/list-class-homeworks.js";
import { CreateClass } from "../../application/create-class.js";
import { DeleteClass } from "../../application/delete-class.js";
import { EnrollStudent } from "../../application/enroll-student.js";
import { GetClassDetail } from "../../application/get-class-detail.js";
import { ListClasses } from "../../application/list-classes.js";
import { ListClassStudents } from "../../application/list-class-students.js";
import { RemoveStudentFromClass } from "../../application/remove-student-from-class.js";
import { UpdateClass } from "../../application/update-class.js";
import { UpdateStudent } from "../../application/update-student.js";
import { PrismaClassRepository } from "../persistence/prisma-class-repository.js";
import { PrismaGradeRepository } from "../persistence/prisma-grade-repository.js";
import { PrismaLearningProfileRepository } from "../persistence/prisma-learning-profile-repository.js";
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
const homeworkRepository = new PrismaHomeworkRepository(prisma);
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
const listClassHomeworks = new ListClassHomeworks(
  classRepository,
  homeworkRepository,
);
const learningProfileRepository = new PrismaLearningProfileRepository(prisma);
const updateClass = new UpdateClass(
  classRepository,
  schoolRepository,
  gradeRepository,
);
const updateStudent = new UpdateStudent(
  classRepository,
  userClassRepository,
  studentRepository,
  learningProfileRepository,
  userLearningProfileRepository,
);
const classController = new ClassController(
  createClass,
  listClasses,
  getClassDetail,
  deleteClass,
  enrollStudent,
  listClassStudents,
  removeStudentFromClass,
  listClassHomeworks,
  updateClass,
  updateStudent,
);

export const classRouter = Router();

classRouter.post("/", authenticate, asyncHandler((req, res) => classController.create(req, res)));
classRouter.get("/", authenticate, asyncHandler((req, res) => classController.list(req, res)));
classRouter.get("/:id", authenticate, asyncHandler((req, res) => classController.show(req, res)));
classRouter.delete("/:id", authenticate, asyncHandler((req, res) => classController.remove(req, res)));
classRouter.get(
  "/:id/alunos",
  authenticate,
  asyncHandler((req, res) => classController.listStudents(req, res)),
);
classRouter.post(
  "/:id/alunos",
  authenticate,
  asyncHandler((req, res) => classController.enroll(req, res)),
);
classRouter.patch(
  "/:id/alunos/:alunoId",
  authenticate,
  asyncHandler((req, res) => classController.updateStudent(req, res)),
);
classRouter.delete(
  "/:id/alunos/:alunoId",
  authenticate,
  asyncHandler((req, res) => classController.removeStudent(req, res)),
);
classRouter.get(
  "/:id/atividades",
  authenticate,
  asyncHandler((req, res) => classController.listHomeworks(req, res)),
);
classRouter.put("/:id", authenticate, asyncHandler((req, res) => classController.update(req, res)));
