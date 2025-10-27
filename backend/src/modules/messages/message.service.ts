import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import { CreateMessageInput, MessageResponse } from './message.types';

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

interface MessageEntity {
  id: string;
  studentId: string;
  trainerId: string;
  fromRole: 'TRAINER' | 'STUDENT';
  content: string;
  createdAt: Date;
}

const toResponse = (message: MessageEntity): MessageResponse => ({
  id: message.id,
  studentId: message.studentId,
  trainerId: message.trainerId,
  fromRole: message.fromRole,
  content: message.content,
  createdAt: message.createdAt.toISOString(),
});

class MessageService {
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
  ): Promise<{ trainer: TrainerRecord; student: StudentRecord }> {
    const trainer = await this.ensureTrainerProfile(trainerUserId);
    const student = await this.ensureStudent(studentId);

    if (student.trainerId !== trainer.id) {
      throw new AppError(403, 'Student does not belong to this trainer');
    }

    return { trainer, student };
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

  private async ensureStudentOwnsConversation(
    studentUserId: string,
    studentId: string,
  ): Promise<StudentRecord> {
    const student = await this.ensureStudentProfileByUser(studentUserId);

    if (student.id !== studentId) {
      throw new AppError(403, 'You do not have access to this conversation');
    }

    return student;
  }

  async listConversation(
    user: { id: string; role: 'admin' | 'trainer' | 'student' },
    studentId: string,
  ): Promise<MessageResponse[]> {
    if (user.role === 'admin') {
      await this.ensureStudent(studentId);
    } else if (user.role === 'trainer') {
      await this.ensureStudentBelongsToTrainer(user.id, studentId);
    } else if (user.role === 'student') {
      await this.ensureStudentOwnsConversation(user.id, studentId);
    } else {
      throw new AppError(403, 'Forbidden');
    }

    const messages = (await prisma.message.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })) as MessageEntity[];

    return messages.map(toResponse);
  }

  async sendMessage(
    user: { id: string; role: 'trainer' | 'student' },
    studentId: string,
    payload: CreateMessageInput,
  ): Promise<MessageResponse> {
    if (user.role === 'trainer') {
      const { trainer, student } = await this.ensureStudentBelongsToTrainer(user.id, studentId);

      const message = (await prisma.message.create({
        data: {
          studentId: student.id,
          trainerId: trainer.id,
          fromRole: 'TRAINER',
          content: payload.content,
        },
      })) as MessageEntity;

      return toResponse(message);
    }

    const student = await this.ensureStudentOwnsConversation(user.id, studentId);

    const message = (await prisma.message.create({
      data: {
        studentId: student.id,
        trainerId: student.trainerId,
        fromRole: 'STUDENT',
        content: payload.content,
      },
    })) as MessageEntity;

    return toResponse(message);
  }
}

export const messageService = new MessageService();
