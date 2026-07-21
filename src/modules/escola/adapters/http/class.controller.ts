import type { Request, Response } from "express";

import { getAuthenticatedUser } from "../../../../shared/auth/authenticate.js";
import type { ListClassHomeworks } from "../../../material/application/list-class-homeworks.js";
import type { CreateClass } from "../../application/create-class.js";
import type { DeleteClass } from "../../application/delete-class.js";
import type { EnrollStudent } from "../../application/enroll-student.js";
import type { GetClassDetail } from "../../application/get-class-detail.js";
import type { ListClasses } from "../../application/list-classes.js";
import type { ListClassStudents } from "../../application/list-class-students.js";
import type { RemoveStudentFromClass } from "../../application/remove-student-from-class.js";
import type { UpdateStudent } from "../../application/update-student.js";
import { createClassSchema } from "./create-class.dto.js";
import { enrollStudentSchema } from "./enroll-student.dto.js";
import { updateStudentSchema } from "./update-student.dto.js";

export class ClassController {
  constructor(
    private readonly createClass: CreateClass,
    private readonly listClasses: ListClasses,
    private readonly getClassDetail: GetClassDetail,
    private readonly deleteClass: DeleteClass,
    private readonly enrollStudent: EnrollStudent,
    private readonly listClassStudents: ListClassStudents,
    private readonly removeStudentFromClass: RemoveStudentFromClass,
    private readonly listClassHomeworks: ListClassHomeworks,
    private readonly updateStudentUseCase: UpdateStudent,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const { name, schoolId, gradeId } = createClassSchema.parse(req.body);
    const { sub: teacherId } = getAuthenticatedUser(req);

    const createdClass = await this.createClass.execute({
      name,
      schoolId,
      gradeId,
      teacherId,
    });

    res.status(201).json(createdClass);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const { sub: teacherId } = getAuthenticatedUser(req);

    const classes = await this.listClasses.execute(teacherId);

    res.status(200).json(classes);
  };

  show = async (req: Request, res: Response): Promise<void> => {
    const id = req.params["id"] as string;
    const { sub: teacherId } = getAuthenticatedUser(req);

    const classDetail = await this.getClassDetail.execute(id, teacherId);

    res.status(200).json(classDetail);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const id = req.params["id"] as string;
    const { sub: teacherId } = getAuthenticatedUser(req);

    await this.deleteClass.execute(id, teacherId);

    res.status(204).send();
  };

  enroll = async (req: Request, res: Response): Promise<void> => {
    const { name, email } = enrollStudentSchema.parse(req.body);
    const classId = req.params["id"] as string;
    const { sub: teacherId } = getAuthenticatedUser(req);

    const student = await this.enrollStudent.execute({
      classId,
      teacherId,
      name,
      email,
    });

    res.status(201).json(student);
  };

  listStudents = async (req: Request, res: Response): Promise<void> => {
    const classId = req.params["id"] as string;
    const { sub: teacherId } = getAuthenticatedUser(req);

    const students = await this.listClassStudents.execute(classId, teacherId);

    res.status(200).json(students);
  };

  listHomeworks = async (req: Request, res: Response): Promise<void> => {
    const classId = req.params["id"] as string;
    const { sub: teacherId } = getAuthenticatedUser(req);

    const homeworks = await this.listClassHomeworks.execute(classId, teacherId);

    res.status(200).json(homeworks);
  };

  updateStudent = async (req: Request, res: Response): Promise<void> => {
    const { name, email } = updateStudentSchema.parse(req.body);
    const classId = req.params["id"] as string;
    const studentId = req.params["alunoId"] as string;
    const { sub: teacherId } = getAuthenticatedUser(req);

    const student = await this.updateStudentUseCase.execute({
      classId,
      teacherId,
      studentId,
      name,
      email,
    });

    res.status(200).json(student);
  };

  removeStudent = async (req: Request, res: Response): Promise<void> => {
    const classId = req.params["id"] as string;
    const studentId = req.params["alunoId"] as string;
    const { sub: teacherId } = getAuthenticatedUser(req);

    await this.removeStudentFromClass.execute({
      classId,
      teacherId,
      studentId,
    });

    res.status(204).send();
  };
}
