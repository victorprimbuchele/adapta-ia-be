import type { Student } from "../../domain/student.js";
import type {
  CreateStudentData,
  StudentRepository,
  UpdateStudentData,
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

  async findById(id: string): Promise<Student | null> {
    return this.students.find((student) => student.id === id) ?? null;
  }

  async findByIds(ids: string[]): Promise<Student[]> {
    const idSet = new Set(ids);
    return this.students.filter((student) => idSet.has(student.id));
  }

  async findByEmail(email: string): Promise<Student | null> {
    return this.students.find((student) => student.email === email) ?? null;
  }

  async create(data: CreateStudentData): Promise<Student> {
    const student: Student = { id: `student-${nextId++}`, ...data };
    this.students.push(student);
    return student;
  }

  async update(id: string, data: UpdateStudentData): Promise<Student> {
    const student = this.students.find((candidate) => candidate.id === id);
    if (!student) {
      throw new Error(`InMemoryStudentRepository: student "${id}" not found.`);
    }
    student.name = data.name;
    student.email = data.email;
    return student;
  }
}
