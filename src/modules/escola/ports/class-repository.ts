import type { Class } from "../domain/class.js";

export interface CreateClassData {
  name: string;
  schoolId: string;
  gradeId: string;
  teacherId: string;
}

export interface ClassRepository {
  create(data: CreateClassData): Promise<Class>;
  findByTeacherId(teacherId: string): Promise<Class[]>;
  findById(id: string): Promise<Class | null>;
}
