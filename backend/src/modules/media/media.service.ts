import path from 'path';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import { CreateMediaInput, MediaResponse, UploadedFileInfo } from './media.types';

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

interface MediaEntity {
  id: string;
  studentId: string;
  type: CreateMediaInput['type'];
  path: string;
  createdAt: Date;
}

const toResponse = (media: MediaEntity): MediaResponse => ({
  id: media.id,
  studentId: media.studentId,
  type: media.type,
  path: media.path,
  createdAt: media.createdAt.toISOString(),
});

const uploadsRelative = (fileName: string) => `uploads/${fileName}`;

class MediaService {
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

  private normalisePath(file: UploadedFileInfo): string {
    const fileName = path.basename(file.filename || file.path);
    return uploadsRelative(fileName).replace(/\\+/g, '/');
  }

  async listForAdmin(studentId: string): Promise<MediaResponse[]> {
    await this.ensureStudent(studentId);

    const mediaItems = (await prisma.media.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })) as MediaEntity[];

    return mediaItems.map(toResponse);
  }

  async listForTrainer(
    trainerUserId: string,
    studentId: string,
  ): Promise<MediaResponse[]> {
    await this.ensureStudentBelongsToTrainer(trainerUserId, studentId);

    const mediaItems = (await prisma.media.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })) as MediaEntity[];

    return mediaItems.map(toResponse);
  }

  async listForStudent(
    studentUserId: string,
    studentId: string,
  ): Promise<MediaResponse[]> {
    const student = await this.ensureStudentProfileByUser(studentUserId);

    if (student.id !== studentId) {
      throw new AppError(403, 'You do not have access to this student');
    }

    const mediaItems = (await prisma.media.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })) as MediaEntity[];

    return mediaItems.map(toResponse);
  }

  async createForTrainer(
    trainerUserId: string,
    studentId: string,
    payload: CreateMediaInput,
    file: UploadedFileInfo,
  ): Promise<MediaResponse> {
    const student = await this.ensureStudentBelongsToTrainer(trainerUserId, studentId);

    const media = (await prisma.media.create({
      data: {
        studentId: student.id,
        type: payload.type,
        path: this.normalisePath(file),
      },
    })) as MediaEntity;

    return toResponse(media);
  }

  async createForStudent(
    studentUserId: string,
    studentId: string,
    payload: CreateMediaInput,
    file: UploadedFileInfo,
  ): Promise<MediaResponse> {
    const student = await this.ensureStudentProfileByUser(studentUserId);

    if (student.id !== studentId) {
      throw new AppError(403, 'You do not have access to this student');
    }

    const media = (await prisma.media.create({
      data: {
        studentId: student.id,
        type: payload.type,
        path: this.normalisePath(file),
      },
    })) as MediaEntity;

    return toResponse(media);
  }
}

export const mediaService = new MediaService();
