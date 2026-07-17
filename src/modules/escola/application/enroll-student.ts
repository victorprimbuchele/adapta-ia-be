import { authorizeClassOwner } from "./authorize-class-owner.js";
import { StudentAlreadyEnrolledError } from "../domain/errors.js";
import type { Student } from "../domain/student.js";
import type { ClassRepository } from "../ports/class-repository.js";
import type { StudentRepository } from "../ports/student-repository.js";
import type { UserClassRepository } from "../ports/user-class-repository.js";

export interface EnrollStudentInput {
  classId: string;
  teacherId: string;
  name: string;
  email: string;
}

/**
 * Cadastra/vincula um aluno a uma turma via `UserClass` (ver Épico 3,
 * BE-E3.1). A autorização por `teacherId` (ver BE-E2.6) é delegada a
 * `authorizeClassOwner`: só o professor responsável pode vincular alunos à
 * sua turma.
 *
 * Aluno é identificado por e-mail: se já existir um cadastro (ex.: o mesmo
 * aluno já vinculado a outra turma), ele é reaproveitado; caso contrário,
 * um novo cadastro é criado a partir do nome e e-mail informados. A mesma
 * vinculação (aluno + turma) nunca é duplicada.
 */
export class EnrollStudent {
  constructor(
    private readonly classRepository: ClassRepository,
    private readonly studentRepository: StudentRepository,
    private readonly userClassRepository: UserClassRepository,
  ) {}

  async execute(input: EnrollStudentInput): Promise<Student> {
    await authorizeClassOwner(
      this.classRepository,
      input.classId,
      input.teacherId,
    );

    const student =
      (await this.studentRepository.findByEmail(input.email)) ??
      (await this.studentRepository.create({
        name: input.name,
        email: input.email,
      }));

    const alreadyEnrolled = await this.userClassRepository.exists(
      input.classId,
      student.id,
    );
    if (alreadyEnrolled) {
      throw new StudentAlreadyEnrolledError(input.email);
    }

    await this.userClassRepository.create(input.classId, student.id);

    return student;
  }
}
