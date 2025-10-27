import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import {
  AssessmentResponse,
  CreateAssessmentInput,
  UpdateAssessmentInput,
} from './assessment.types';

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

interface AssessmentEntity {
  id: string;
  studentId: string;
  trainerId: string;
  metricsJson: unknown;
  date: Date;
  createdAt: Date;
}

type AssessmentWithStudent = AssessmentEntity & {
  student: StudentRecord;
};

const toResponse = (assessment: AssessmentEntity): AssessmentResponse => ({
  id: assessment.id,
  studentId: assessment.studentId,
  trainerId: assessment.trainerId,
  metricsJson: assessment.metricsJson as AssessmentResponse['metricsJson'],
  date: assessment.date.toISOString(),
  createdAt: assessment.createdAt.toISOString(),
});

class AssessmentService {
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

  private async getAssessmentWithStudent(
    assessmentId: string,
  ): Promise<AssessmentWithStudent> {
    const assessment = (await prisma.assessment.findUnique({
      where: { id: assessmentId },
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
    })) as AssessmentWithStudent | null;

    if (!assessment) {
      throw new AppError(404, 'Assessment not found');
    }

    return assessment;
  }

  private async ensureTrainerOwnsAssessment(
    trainerUserId: string,
    assessmentId: string,
  ): Promise<AssessmentWithStudent> {
    const trainer = await this.ensureTrainerProfile(trainerUserId);
    const assessment = await this.getAssessmentWithStudent(assessmentId);

    if (assessment.trainerId !== trainer.id) {
      throw new AppError(403, 'Assessment does not belong to this trainer');
    }

    return assessment;
  }

  private async ensureStudentOwnsAssessment(
    studentUserId: string,
    assessmentId: string,
  ): Promise<AssessmentWithStudent> {
    const student = await this.ensureStudentProfileByUser(studentUserId);
    const assessment = await this.getAssessmentWithStudent(assessmentId);

    if (assessment.student.id !== student.id) {
      throw new AppError(403, 'You do not have access to this assessment');
    }

    return assessment;
  }

  async listForAdmin(studentId: string): Promise<AssessmentResponse[]> {
    await this.ensureStudent(studentId);

    const assessments = (await prisma.assessment.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    })) as AssessmentEntity[];

    return assessments.map(toResponse);
  }

  async listForTrainer(
    trainerUserId: string,
    studentId: string,
  ): Promise<AssessmentResponse[]> {
    await this.ensureStudentBelongsToTrainer(trainerUserId, studentId);

    const assessments = (await prisma.assessment.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    })) as AssessmentEntity[];

    return assessments.map(toResponse);
  }

  async listForStudent(
    studentUserId: string,
    studentId: string,
  ): Promise<AssessmentResponse[]> {
    const student = await this.ensureStudentProfileByUser(studentUserId);

    if (student.id !== studentId) {
      throw new AppError(403, 'You do not have access to this student');
    }

    const assessments = (await prisma.assessment.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    })) as AssessmentEntity[];

    return assessments.map(toResponse);
  }

  async createForTrainer(
    trainerUserId: string,
    studentId: string,
    payload: CreateAssessmentInput,
  ): Promise<AssessmentResponse> {
    const student = await this.ensureStudentBelongsToTrainer(trainerUserId, studentId);

    const assessment = (await prisma.assessment.create({
      data: {
        studentId: student.id,
        trainerId: student.trainerId,
        metricsJson: payload.metricsJson,
        date: new Date(payload.date),
      },
    })) as AssessmentEntity;

    return toResponse(assessment);
  }

  async getForAdmin(assessmentId: string): Promise<AssessmentResponse> {
    const assessment = await this.getAssessmentWithStudent(assessmentId);
    return toResponse(assessment);
  }

  async getForTrainer(
    trainerUserId: string,
    assessmentId: string,
  ): Promise<AssessmentResponse> {
    const assessment = await this.ensureTrainerOwnsAssessment(trainerUserId, assessmentId);
    return toResponse(assessment);
  }

  async getForStudent(
    studentUserId: string,
    assessmentId: string,
  ): Promise<AssessmentResponse> {
    const assessment = await this.ensureStudentOwnsAssessment(studentUserId, assessmentId);
    return toResponse(assessment);
  }

  async updateForTrainer(
    trainerUserId: string,
    assessmentId: string,
    payload: UpdateAssessmentInput,
  ): Promise<AssessmentResponse> {
    await this.ensureTrainerOwnsAssessment(trainerUserId, assessmentId);

    const data: Record<string, unknown> = {};

    if (payload.metricsJson !== undefined) {
      data.metricsJson = payload.metricsJson;
    }

    if (payload.date !== undefined) {
      data.date = new Date(payload.date);
    }

    const updated = (await prisma.assessment.update({
      where: { id: assessmentId },
      data,
    })) as AssessmentEntity;

    return toResponse(updated);
  }

  async deleteForTrainer(trainerUserId: string, assessmentId: string): Promise<void> {
    await this.ensureTrainerOwnsAssessment(trainerUserId, assessmentId);
    await prisma.assessment.delete({ where: { id: assessmentId } });
  }
}

export const assessmentService = new AssessmentService();
