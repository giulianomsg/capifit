import bcrypt from 'bcrypt';
import { Prisma, PrismaClient, UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import {
  CreateStudentInput,
  UpdateStudentByTrainerInput,
  UpdateStudentSelfInput,
} from './student.types';

const studentInclude = {
  user: true,
  trainer: {
    include: {
      user: true,
    },
  },
} satisfies Prisma.StudentInclude;

const studentQueryArgs = {
  include: studentInclude,
} satisfies Prisma.StudentDefaultArgs;

type StudentWithRelations = Prisma.StudentGetPayload<typeof studentQueryArgs>;

export interface StudentResponse {
  id: string;
  userId: string;
  trainerId: string;
  name: string;
  email: string;
  isActive: boolean;
  trainer: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

const toStudentResponse = (student: StudentWithRelations): StudentResponse => ({
  id: student.id,
  userId: student.userId,
  trainerId: student.trainerId,
  name: student.user.name,
  email: student.user.email,
  isActive: student.user.isActive,
  trainer: {
    id: student.trainer.id,
    name: student.trainer.user.name,
  },
  createdAt: student.createdAt.toISOString(),
  updatedAt: student.updatedAt.toISOString(),
});

export class StudentService {
  private async ensureTrainerProfile(userId: string) {
    const trainer = await prisma.trainer.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!trainer) {
      throw new AppError(403, 'Trainer profile not found');
    }

    if (!trainer.user.isActive) {
      throw new AppError(403, 'Trainer account is not active');
    }

    return trainer;
  }

  private async getStudentById(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: studentInclude,
    });

    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    return student;
  }

  async listAll(): Promise<StudentResponse[]> {
    const students = await prisma.student.findMany({ include: studentInclude });
    return students.map(toStudentResponse);
  }

  async listForTrainer(trainerUserId: string): Promise<StudentResponse[]> {
    const trainer = await this.ensureTrainerProfile(trainerUserId);
    const students = await prisma.student.findMany({
      where: { trainerId: trainer.id },
      include: studentInclude,
    });

    return students.map(toStudentResponse);
  }

  async createForTrainer(
    trainerUserId: string,
    payload: CreateStudentInput,
  ): Promise<StudentResponse> {
    const trainer = await this.ensureTrainerProfile(trainerUserId);
    const passwordHash = await bcrypt.hash(payload.password, 10);

    try {
      const result = await prisma.$transaction(async (tx: PrismaClient) => {
        const user = await tx.user.create({
          data: {
            name: payload.name,
            email: payload.email,
            passwordHash,
            role: UserRole.STUDENT,
            isActive: payload.isActive ?? true,
          },
        });

        return tx.student.create({
          data: {
            userId: user.id,
            trainerId: trainer.id,
          },
          include: studentInclude,
        });
      });

      return toStudentResponse(result as StudentWithRelations);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppError(409, 'E-mail is already in use');
      }

      throw error;
    }
  }

  async getForTrainer(trainerUserId: string, studentId: string): Promise<StudentResponse> {
    const trainer = await this.ensureTrainerProfile(trainerUserId);
    const student = await this.getStudentById(studentId);

    if (student.trainerId !== trainer.id) {
      throw new AppError(403, 'Student does not belong to this trainer');
    }

    return toStudentResponse(student);
  }

  async getForAdmin(studentId: string): Promise<StudentResponse> {
    const student = await this.getStudentById(studentId);
    return toStudentResponse(student);
  }

  async getOwnProfile(studentUserId: string, studentId: string): Promise<StudentResponse> {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      include: studentInclude,
    });

    if (!student) {
      throw new AppError(404, 'Student profile not found');
    }

    if (student.id !== studentId) {
      throw new AppError(403, 'You do not have access to this student');
    }

    return toStudentResponse(student);
  }

  async updateForTrainer(
    trainerUserId: string,
    studentId: string,
    payload: UpdateStudentByTrainerInput,
  ): Promise<StudentResponse> {
    const trainer = await this.ensureTrainerProfile(trainerUserId);
    const student = await this.getStudentById(studentId);

    if (student.trainerId !== trainer.id) {
      throw new AppError(403, 'Student does not belong to this trainer');
    }

    const userUpdates: Prisma.UserUpdateInput = {};

    if (payload.name) {
      userUpdates.name = payload.name;
    }

    if (payload.email) {
      userUpdates.email = payload.email;
    }

    if (typeof payload.isActive === 'boolean') {
      userUpdates.isActive = payload.isActive;
    }

    if (payload.password) {
      userUpdates.passwordHash = await bcrypt.hash(payload.password, 10);
    }

    try {
      const updated = await prisma.$transaction(async (tx: PrismaClient) => {
        if (Object.keys(userUpdates).length > 0) {
          await tx.user.update({
            where: { id: student.userId },
            data: userUpdates,
          });
        }

        return tx.student.findUniqueOrThrow({
          where: { id: studentId },
          include: studentInclude,
        });
      });

      return toStudentResponse(updated as StudentWithRelations);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppError(409, 'E-mail is already in use');
      }

      throw error;
    }
  }

  async updateOwnProfile(
    studentUserId: string,
    studentId: string,
    payload: UpdateStudentSelfInput,
  ): Promise<StudentResponse> {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      include: studentInclude,
    });

    if (!student) {
      throw new AppError(404, 'Student profile not found');
    }

    if (student.id !== studentId) {
      throw new AppError(403, 'You do not have access to this student');
    }

    const userUpdates: Prisma.UserUpdateInput = {};

    if (payload.name) {
      userUpdates.name = payload.name;
    }

    if (payload.email) {
      userUpdates.email = payload.email;
    }

    if (payload.password) {
      userUpdates.passwordHash = await bcrypt.hash(payload.password, 10);
    }

    if (Object.keys(userUpdates).length === 0) {
      return toStudentResponse(student as StudentWithRelations);
    }

    try {
      const updated = await prisma.$transaction(async (tx: PrismaClient) => {
        await tx.user.update({
          where: { id: student.userId },
          data: userUpdates,
        });

        return tx.student.findUniqueOrThrow({
          where: { id: student.id },
          include: studentInclude,
        });
      });

      return toStudentResponse(updated as StudentWithRelations);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppError(409, 'E-mail is already in use');
      }

      throw error;
    }
  }

  async deleteForTrainer(trainerUserId: string, studentId: string): Promise<void> {
    const trainer = await this.ensureTrainerProfile(trainerUserId);
    const student = await this.getStudentById(studentId);

    if (student.trainerId !== trainer.id) {
      throw new AppError(403, 'Student does not belong to this trainer');
    }

    await prisma.$transaction(async (tx: PrismaClient) => {
      await tx.user.delete({ where: { id: student.userId } });
    });
  }

  async deleteAsAdmin(studentId: string): Promise<void> {
    const student = await this.getStudentById(studentId);

    await prisma.$transaction(async (tx: PrismaClient) => {
      await tx.user.delete({ where: { id: student.userId } });
    });
  }
}

export const studentService = new StudentService();
