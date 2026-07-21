import type { Class } from "../domain/class.js";

export interface CreateClassData {
  name: string;
  schoolId: string;
  gradeId: string;
  teacherId: string;
}

export interface UpdateClassData {
  name: string;
  schoolId: string;
  gradeId: string;
}

export interface ClassRepository {
  create(data: CreateClassData): Promise<Class>;
  update(id: string, data: UpdateClassData): Promise<Class>;
  /** Nunca retorna turmas com soft delete (`deletedAt` preenchido). */
  findByTeacherId(teacherId: string): Promise<Class[]>;
  /** Nunca retorna turmas com soft delete (`deletedAt` preenchido). */
  findById(id: string): Promise<Class | null>;
  /** Soft delete (ver Épico 2, BE-E2.7): marca `deletedAt`, nunca remove a linha. */
  softDelete(id: string): Promise<void>;
}
