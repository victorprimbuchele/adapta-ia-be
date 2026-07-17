import type { Student } from "../domain/student.js";

export interface CreateStudentData {
  name: string;
  email: string;
}

export interface StudentRepository {
  findByEmail(email: string): Promise<Student | null>;
  create(data: CreateStudentData): Promise<Student>;
}
