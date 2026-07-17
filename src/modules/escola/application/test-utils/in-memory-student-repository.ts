import type { Student } from "../../domain/student.js";
import type {
  CreateStudentData,
  StudentRepository,
} from "../../ports/student-repository.js";

let nextId = 1;

/**
 * Fake de `StudentRepository` em memória, usado apenas nos testes de
 * comportamento das camadas de application/domain (ver ADR 009: sem mocks
 * de infraestrutura pesados para testes de regra de negócio).
 */
export class InMemoryStudentRepository implements StudentRepository {
  readonly students: Student[];

  constructor(students: Student[] = []) {
    this.students = students;
  }

  async findByEmail(email: string): Promise<Student | null> {
    return this.students.find((student) => student.email === email) ?? null;
  }

  async create(data: CreateStudentData): Promise<Student> {
    const student: Student = { id: `student-${nextId++}`, ...data };
    this.students.push(student);
    return student;
  }
}
