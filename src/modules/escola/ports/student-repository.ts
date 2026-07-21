import type { Student } from "../domain/student.js";

export interface CreateStudentData {
  name: string;
  email: string;
}

export interface UpdateStudentData {
  name: string;
  email: string;
}

export interface StudentRepository {
  findById(id: string): Promise<Student | null>;
  findByIds(ids: string[]): Promise<Student[]>;
  findByEmail(email: string): Promise<Student | null>;
  create(data: CreateStudentData): Promise<Student>;
  update(id: string, data: UpdateStudentData): Promise<Student>;
}
