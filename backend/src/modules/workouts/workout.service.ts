import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import {
  CreateWorkoutInput,
  UpdateWorkoutInput,
  WorkoutResponse,
} from './workout.types';

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

interface WorkoutEntity {
  id: string;
  studentId: string;
  title: string;
  planJson: unknown;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
}

type WorkoutWithStudent = WorkoutEntity & {
  student: StudentRecord;
};

const toResponse = (workout: WorkoutEntity): WorkoutResponse => ({
  id: workout.id,
  studentId: workout.studentId,
  title: workout.title,
  planJson: workout.planJson,
  startDate: workout.startDate ? workout.startDate.toISOString() : null,
  endDate: workout.endDate ? workout.endDate.toISOString() : null,
  createdAt: workout.createdAt.toISOString(),
});

class WorkoutService {
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

  private async getWorkoutWithStudent(workoutId: string): Promise<WorkoutWithStudent> {
    const workout = (await prisma.workout.findUnique({
      where: { id: workoutId },
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
    })) as WorkoutWithStudent | null;

    if (!workout) {
      throw new AppError(404, 'Workout not found');
    }

    return workout;
  }

  private async ensureTrainerOwnsWorkout(
    trainerUserId: string,
    workoutId: string,
  ): Promise<WorkoutWithStudent> {
    const trainer = await this.ensureTrainerProfile(trainerUserId);
    const workout = await this.getWorkoutWithStudent(workoutId);

    if (workout.student.trainerId !== trainer.id) {
      throw new AppError(403, 'Workout does not belong to this trainer');
    }

    return workout;
  }

  private async ensureStudentOwnsWorkout(
    studentUserId: string,
    workoutId: string,
  ): Promise<WorkoutWithStudent> {
    const student = await this.ensureStudentProfileByUser(studentUserId);
    const workout = await this.getWorkoutWithStudent(workoutId);

    if (workout.student.id !== student.id) {
      throw new AppError(403, 'You do not have access to this workout');
    }

    return workout;
  }

  async listForAdmin(studentId: string): Promise<WorkoutResponse[]> {
    await this.ensureStudent(studentId);

    const workouts = (await prisma.workout.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })) as WorkoutEntity[];

    return workouts.map(toResponse);
  }

  async listForTrainer(
    trainerUserId: string,
    studentId: string,
  ): Promise<WorkoutResponse[]> {
    await this.ensureStudentBelongsToTrainer(trainerUserId, studentId);

    const workouts = (await prisma.workout.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })) as WorkoutEntity[];

    return workouts.map(toResponse);
  }

  async listForStudent(
    studentUserId: string,
    studentId: string,
  ): Promise<WorkoutResponse[]> {
    const student = await this.ensureStudentProfileByUser(studentUserId);

    if (student.id !== studentId) {
      throw new AppError(403, 'You do not have access to this student');
    }

    const workouts = (await prisma.workout.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })) as WorkoutEntity[];

    return workouts.map(toResponse);
  }

  async createForTrainer(
    trainerUserId: string,
    studentId: string,
    payload: CreateWorkoutInput,
  ): Promise<WorkoutResponse> {
    await this.ensureStudentBelongsToTrainer(trainerUserId, studentId);

    const workout = (await prisma.workout.create({
      data: {
        studentId,
        title: payload.title,
        planJson: payload.planJson,
        startDate: payload.startDate ? new Date(payload.startDate) : null,
        endDate: payload.endDate ? new Date(payload.endDate) : null,
      },
    })) as WorkoutEntity;

    return toResponse(workout);
  }

  async getForAdmin(workoutId: string): Promise<WorkoutResponse> {
    const workout = await this.getWorkoutWithStudent(workoutId);
    return toResponse(workout);
  }

  async getForTrainer(
    trainerUserId: string,
    workoutId: string,
  ): Promise<WorkoutResponse> {
    const workout = await this.ensureTrainerOwnsWorkout(trainerUserId, workoutId);
    return toResponse(workout);
  }

  async getForStudent(
    studentUserId: string,
    workoutId: string,
  ): Promise<WorkoutResponse> {
    const workout = await this.ensureStudentOwnsWorkout(studentUserId, workoutId);
    return toResponse(workout);
  }

  async updateForTrainer(
    trainerUserId: string,
    workoutId: string,
    payload: UpdateWorkoutInput,
  ): Promise<WorkoutResponse> {
    await this.ensureTrainerOwnsWorkout(trainerUserId, workoutId);

    const data: Record<string, unknown> = {};

    if (payload.title !== undefined) {
      data.title = payload.title;
    }

    if (payload.planJson !== undefined) {
      data.planJson = payload.planJson;
    }

    if (payload.startDate !== undefined) {
      data.startDate = new Date(payload.startDate);
    }

    if (payload.endDate !== undefined) {
      data.endDate = new Date(payload.endDate);
    }

    const updated = (await prisma.workout.update({
      where: { id: workoutId },
      data,
    })) as WorkoutEntity;

    return toResponse(updated);
  }

  async deleteForTrainer(trainerUserId: string, workoutId: string): Promise<void> {
    await this.ensureTrainerOwnsWorkout(trainerUserId, workoutId);
    await prisma.workout.delete({ where: { id: workoutId } });
  }
}

export const workoutService = new WorkoutService();
