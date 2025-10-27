import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import {
  CreateDietInput,
  DietResponse,
  UpdateDietInput,
} from './diet.types';

interface TrainerRecord {
  id: string;
  userId: string;
  user: {
    id: string;
    isActive: boolean;
  };
}

interface StudentRecord {
  id: string;
  userId: string;
  trainerId: string;
  user: {
    id: string;
  };
  trainer: TrainerRecord;
}

interface DietEntity {
  id: string;
  studentId: string;
  title: string;
  planJson: unknown;
  calories: number | null;
  macrosJson: unknown | null;
  createdAt: Date;
}

type DietWithStudent = DietEntity & {
  student: StudentRecord;
};

const toResponse = (diet: DietEntity): DietResponse => ({
  id: diet.id,
  studentId: diet.studentId,
  title: diet.title,
  planJson: diet.planJson,
  calories: diet.calories ?? null,
  macrosJson: diet.macrosJson ?? null,
  createdAt: diet.createdAt.toISOString(),
});

class DietService {
  private async ensureTrainerProfile(userId: string): Promise<TrainerRecord> {
    const trainer = (await prisma.trainer.findUnique({
      where: { userId },
      include: { user: true },
    })) as TrainerRecord | null;

    if (!trainer) {
      throw new AppError(403, 'Trainer profile not found');
    }

    if (!trainer.user.isActive) {
      throw new AppError(403, 'Trainer account is not active');
    }

    return trainer;
  }

  private async ensureStudent(studentId: string): Promise<StudentRecord> {
    const student = (await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        trainer: {
          include: { user: true },
        },
        user: true,
      },
    })) as StudentRecord | null;

    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    return student;
  }

  private async ensureStudentBelongsToTrainer(
    trainerUserId: string,
    studentId: string,
  ): Promise<StudentRecord> {
    const trainer = await this.ensureTrainerProfile(trainerUserId);
    const student = await this.ensureStudent(studentId);

    if (student.trainerId !== trainer.id) {
      throw new AppError(403, 'Student does not belong to this trainer');
    }

    return student;
  }

  private async ensureStudentProfileByUser(userId: string): Promise<StudentRecord> {
    const student = (await prisma.student.findUnique({
      where: { userId },
      include: {
        trainer: {
          include: { user: true },
        },
        user: true,
      },
    })) as StudentRecord | null;

    if (!student) {
      throw new AppError(404, 'Student profile not found');
    }

    return student;
  }

  private async getDietWithStudent(dietId: string): Promise<DietWithStudent> {
    const diet = (await prisma.diet.findUnique({
      where: { id: dietId },
      include: {
        student: {
          include: {
            trainer: {
              include: { user: true },
            },
            user: true,
          },
        },
      },
    })) as DietWithStudent | null;

    if (!diet) {
      throw new AppError(404, 'Diet not found');
    }

    return diet;
  }

  private async ensureTrainerOwnsDiet(
    trainerUserId: string,
    dietId: string,
  ): Promise<DietWithStudent> {
    const trainer = await this.ensureTrainerProfile(trainerUserId);
    const diet = await this.getDietWithStudent(dietId);

    if (diet.student.trainerId !== trainer.id) {
      throw new AppError(403, 'Diet does not belong to this trainer');
    }

    return diet;
  }

  private async ensureStudentOwnsDiet(
    studentUserId: string,
    dietId: string,
  ): Promise<DietWithStudent> {
    const student = await this.ensureStudentProfileByUser(studentUserId);
    const diet = await this.getDietWithStudent(dietId);

    if (diet.student.id !== student.id) {
      throw new AppError(403, 'You do not have access to this diet');
    }

    return diet;
  }

  async listForAdmin(studentId: string): Promise<DietResponse[]> {
    await this.ensureStudent(studentId);

    const diets = (await prisma.diet.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })) as DietEntity[];

    return diets.map(toResponse);
  }

  async listForTrainer(
    trainerUserId: string,
    studentId: string,
  ): Promise<DietResponse[]> {
    await this.ensureStudentBelongsToTrainer(trainerUserId, studentId);

    const diets = (await prisma.diet.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })) as DietEntity[];

    return diets.map(toResponse);
  }

  async listForStudent(
    studentUserId: string,
    studentId: string,
  ): Promise<DietResponse[]> {
    const student = await this.ensureStudentProfileByUser(studentUserId);

    if (student.id !== studentId) {
      throw new AppError(403, 'You do not have access to this student');
    }

    const diets = (await prisma.diet.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })) as DietEntity[];

    return diets.map(toResponse);
  }

  async createForTrainer(
    trainerUserId: string,
    studentId: string,
    payload: CreateDietInput,
  ): Promise<DietResponse> {
    await this.ensureStudentBelongsToTrainer(trainerUserId, studentId);

    const diet = (await prisma.diet.create({
      data: {
        studentId,
        title: payload.title,
        planJson: payload.planJson,
        calories: payload.calories,
        macrosJson: payload.macrosJson,
      },
    })) as DietEntity;

    return toResponse(diet);
  }

  async getForAdmin(dietId: string): Promise<DietResponse> {
    const diet = await this.getDietWithStudent(dietId);
    return toResponse(diet);
  }

  async getForTrainer(
    trainerUserId: string,
    dietId: string,
  ): Promise<DietResponse> {
    const diet = await this.ensureTrainerOwnsDiet(trainerUserId, dietId);
    return toResponse(diet);
  }

  async getForStudent(
    studentUserId: string,
    dietId: string,
  ): Promise<DietResponse> {
    const diet = await this.ensureStudentOwnsDiet(studentUserId, dietId);
    return toResponse(diet);
  }

  async updateForTrainer(
    trainerUserId: string,
    dietId: string,
    payload: UpdateDietInput,
  ): Promise<DietResponse> {
    await this.ensureTrainerOwnsDiet(trainerUserId, dietId);

    const data: Record<string, unknown> = {};

    if (payload.title !== undefined) {
      data.title = payload.title;
    }

    if (payload.planJson !== undefined) {
      data.planJson = payload.planJson;
    }

    if (payload.calories !== undefined) {
      data.calories = payload.calories;
    }

    if (payload.macrosJson !== undefined) {
      data.macrosJson = payload.macrosJson;
    }

    const updated = (await prisma.diet.update({
      where: { id: dietId },
      data,
    })) as DietEntity;

    return toResponse(updated);
  }

  async deleteForTrainer(trainerUserId: string, dietId: string): Promise<void> {
    await this.ensureTrainerOwnsDiet(trainerUserId, dietId);
    await prisma.diet.delete({ where: { id: dietId } });
  }
}

export const dietService = new DietService();
