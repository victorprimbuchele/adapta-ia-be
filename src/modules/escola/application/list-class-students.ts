import { authorizeClassOwner } from "./authorize-class-owner.js";
import type { ClassStudentWithProfile } from "../domain/student.js";
import type { ClassRepository } from "../ports/class-repository.js";
import type { StudentRepository } from "../ports/student-repository.js";
import type { UserClassRepository } from "../ports/user-class-repository.js";
import type { UserLearningProfileRepository } from "../ports/user-learning-profile-repository.js";

/**
 * Lista os alunos de uma turma com o perfil de aprendizagem vinculado
 * (ou `null` se ainda não houver) — ver Épico 3, BE-E3.3. A autorização
 * por `teacherId` é delegada a `authorizeClassOwner`.
 */
export class ListClassStudents {
  constructor(
    private readonly classRepository: ClassRepository,
    private readonly userClassRepository: UserClassRepository,
    private readonly studentRepository: StudentRepository,
    private readonly userLearningProfileRepository: UserLearningProfileRepository,
  ) {}

  async execute(
    classId: string,
    teacherId: string,
  ): Promise<ClassStudentWithProfile[]> {
    await authorizeClassOwner(this.classRepository, classId, teacherId);

    const studentIds =
      await this.userClassRepository.listStudentIdsByClassId(classId);
    if (studentIds.length === 0) {
      return [];
    }

    const [students, profilesByUserId] = await Promise.all([
      this.studentRepository.findByIds(studentIds),
      this.userLearningProfileRepository.findLearningProfilesByUserIds(
        studentIds,
      ),
    ]);

    const studentsById = new Map(
      students.map((student) => [student.id, student]),
    );

    return studentIds.flatMap((studentId) => {
      const student = studentsById.get(studentId);
      if (!student) {
        return [];
      }

      return [
        {
          ...student,
          learningProfile: profilesByUserId.get(studentId) ?? null,
        },
      ];
    });
  }
}
