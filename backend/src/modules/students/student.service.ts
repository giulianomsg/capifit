import { v4 as uuid } from 'uuid';
import { StudentProfile } from './student.types';

const students: StudentProfile[] = [];

export class StudentService {
  listByTrainer(trainerId: string): StudentProfile[] {
    return students.filter((student) => student.trainerId === trainerId);
  }

  create(data: Omit<StudentProfile, 'id' | 'createdAt'>): StudentProfile {
    const student: StudentProfile = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString()
    };

    students.push(student);
    return student;
  }

  update(id: string, updates: Partial<StudentProfile>): StudentProfile {
    const student = students.find((item) => item.id === id);
    if (!student) {
      throw new Error('Student not found');
    }

    Object.assign(student, updates);
    return student;
  }
}

export const studentService = new StudentService();
