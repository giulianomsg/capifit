import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import {
  CreateSubscriptionInput,
  SubscriptionQueryInput,
  SubscriptionResponse,
  SubscriptionOwnerType,
  SubscriptionPlanType,
  SubscriptionStatus,
  UpdateSubscriptionInput,
  UpdateSubscriptionAsStudentInput,
} from './subscription.types';

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

interface SubscriptionEntity {
  id: string;
  ownerType: SubscriptionOwnerType;
  ownerId: string;
  planType: SubscriptionPlanType;
  status: SubscriptionStatus;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const toResponse = (subscription: SubscriptionEntity): SubscriptionResponse => ({
  id: subscription.id,
  ownerType: subscription.ownerType,
  ownerId: subscription.ownerId,
  planType: subscription.planType,
  status: subscription.status,
  startsAt: subscription.startsAt.toISOString(),
  endsAt: subscription.endsAt.toISOString(),
  createdAt: subscription.createdAt.toISOString(),
  updatedAt: subscription.updatedAt.toISOString(),
});

class SubscriptionService {
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

  private async ensureTrainerById(trainerId: string): Promise<TrainerRecord> {
    const trainer = (await prisma.trainer.findUnique({
      where: { id: trainerId },
      include: { user: true },
    })) as TrainerRecord | null;

    if (!trainer) {
      throw new AppError(404, 'Trainer not found');
    }

    return trainer;
  }

  private async ensureStudentById(studentId: string): Promise<StudentRecord> {
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

  private async getSubscriptionById(id: string): Promise<SubscriptionEntity> {
    const subscription = (await prisma.subscription.findUnique({
      where: { id },
    })) as SubscriptionEntity | null;

    if (!subscription) {
      throw new AppError(404, 'Subscription not found');
    }

    return subscription;
  }

  private async ensureTrainerOwnsSubscription(
    trainerUserId: string,
    subscriptionId: string,
  ): Promise<{ trainer: TrainerRecord; subscription: SubscriptionEntity }> {
    const trainer = await this.ensureTrainerProfile(trainerUserId);
    const subscription = await this.getSubscriptionById(subscriptionId);

    if (subscription.ownerType === 'TRAINER') {
      if (subscription.ownerId !== trainer.id) {
        throw new AppError(403, 'Subscription does not belong to this trainer');
      }

      return { trainer, subscription };
    }

    const student = await this.ensureStudentById(subscription.ownerId);

    if (student.trainerId !== trainer.id) {
      throw new AppError(403, 'Subscription does not belong to this trainer');
    }

    return { trainer, subscription };
  }

  private async ensureStudentOwnsSubscription(
    studentUserId: string,
    subscriptionId: string,
  ): Promise<{ student: StudentRecord; subscription: SubscriptionEntity }> {
    const student = await this.ensureStudentProfileByUser(studentUserId);
    const subscription = await this.getSubscriptionById(subscriptionId);

    if (subscription.ownerType !== 'STUDENT' || subscription.ownerId !== student.id) {
      throw new AppError(403, 'You do not have access to this subscription');
    }

    return { student, subscription };
  }

  private buildSubscriptionResponseList(subscriptions: SubscriptionEntity[]): SubscriptionResponse[] {
    return subscriptions.map(toResponse);
  }

  private async validateOwner(ownerType: SubscriptionOwnerType, ownerId: string): Promise<void> {
    if (ownerType === 'TRAINER') {
      await this.ensureTrainerById(ownerId);
      return;
    }

    await this.ensureStudentById(ownerId);
  }

  async listForAdmin(filters: SubscriptionQueryInput): Promise<SubscriptionResponse[]> {
    const where: Record<string, unknown> = {};

    if (filters.ownerType) {
      where.ownerType = filters.ownerType;
    }

    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    const subscriptions = (await prisma.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })) as SubscriptionEntity[];

    return this.buildSubscriptionResponseList(subscriptions);
  }

  async listForTrainer(
    trainerUserId: string,
    filters: SubscriptionQueryInput,
  ): Promise<SubscriptionResponse[]> {
    const trainer = await this.ensureTrainerProfile(trainerUserId);
    const studentIds = (await prisma.student.findMany({
      where: { trainerId: trainer.id },
      select: { id: true },
    })).map((student: { id: string }) => student.id);

    if (filters.ownerId) {
      if (filters.ownerType === 'TRAINER') {
        if (filters.ownerId !== trainer.id) {
          throw new AppError(403, 'You do not have access to this subscription');
        }
      } else if (filters.ownerType === 'STUDENT' || !filters.ownerType) {
        if (!studentIds.includes(filters.ownerId)) {
          throw new AppError(403, 'You do not have access to this subscription');
        }
      }
    }

    if (filters.ownerType && filters.ownerType !== 'TRAINER' && filters.ownerType !== 'STUDENT') {
      throw new AppError(400, 'Invalid ownerType');
    }

    let where: Record<string, unknown>;

    if (filters.ownerId) {
      if (filters.ownerType === 'TRAINER' || (!filters.ownerType && filters.ownerId === trainer.id)) {
        where = { ownerType: 'TRAINER', ownerId: trainer.id };
      } else {
        if (!studentIds.includes(filters.ownerId)) {
          throw new AppError(403, 'You do not have access to this subscription');
        }

        where = { ownerType: 'STUDENT', ownerId: filters.ownerId };
      }
    } else if (filters.ownerType === 'TRAINER') {
      where = { ownerType: 'TRAINER', ownerId: trainer.id };
    } else if (filters.ownerType === 'STUDENT') {
      if (!studentIds.length) {
        return [];
      }

      where = { ownerType: 'STUDENT', ownerId: { in: studentIds } };
    } else {
      const orConditions: Array<Record<string, unknown>> = [
        { ownerType: 'TRAINER', ownerId: trainer.id },
      ];

      if (studentIds.length) {
        orConditions.push({ ownerType: 'STUDENT', ownerId: { in: studentIds } });
      }

      where = { OR: orConditions };
    }

    const subscriptions = (await prisma.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })) as SubscriptionEntity[];

    return this.buildSubscriptionResponseList(subscriptions);
  }

  async listForStudent(
    studentUserId: string,
    filters: SubscriptionQueryInput,
  ): Promise<SubscriptionResponse[]> {
    const student = await this.ensureStudentProfileByUser(studentUserId);

    if (filters.ownerType && filters.ownerType !== 'STUDENT') {
      throw new AppError(403, 'You do not have access to this subscription');
    }

    if (filters.ownerId && filters.ownerId !== student.id) {
      throw new AppError(403, 'You do not have access to this subscription');
    }

    const subscriptions = (await prisma.subscription.findMany({
      where: {
        ownerType: 'STUDENT',
        ownerId: student.id,
      },
      orderBy: { createdAt: 'desc' },
    })) as SubscriptionEntity[];

    return this.buildSubscriptionResponseList(subscriptions);
  }

  async createAsAdmin(payload: CreateSubscriptionInput): Promise<SubscriptionResponse> {
    await this.validateOwner(payload.ownerType, payload.ownerId);

    const subscription = (await prisma.subscription.create({
      data: {
        ownerType: payload.ownerType,
        ownerId: payload.ownerId,
        planType: payload.planType,
        status: payload.status,
        startsAt: new Date(payload.startsAt),
        endsAt: new Date(payload.endsAt),
      },
    })) as SubscriptionEntity;

    return toResponse(subscription);
  }

  async createAsTrainer(
    trainerUserId: string,
    payload: CreateSubscriptionInput,
  ): Promise<SubscriptionResponse> {
    const trainer = await this.ensureTrainerProfile(trainerUserId);

    if (payload.ownerType === 'TRAINER') {
      if (payload.ownerId !== trainer.id) {
        throw new AppError(403, 'You can only create subscriptions for yourself or your students');
      }
    } else {
      const student = await this.ensureStudentById(payload.ownerId);
      if (student.trainerId !== trainer.id) {
        throw new AppError(403, 'You can only create subscriptions for yourself or your students');
      }
    }

    const subscription = (await prisma.subscription.create({
      data: {
        ownerType: payload.ownerType,
        ownerId: payload.ownerId,
        planType: payload.planType,
        status: payload.status,
        startsAt: new Date(payload.startsAt),
        endsAt: new Date(payload.endsAt),
      },
    })) as SubscriptionEntity;

    return toResponse(subscription);
  }

  async getForAdmin(subscriptionId: string): Promise<SubscriptionResponse> {
    const subscription = await this.getSubscriptionById(subscriptionId);
    return toResponse(subscription);
  }

  async getForTrainer(
    trainerUserId: string,
    subscriptionId: string,
  ): Promise<SubscriptionResponse> {
    const { subscription } = await this.ensureTrainerOwnsSubscription(trainerUserId, subscriptionId);
    return toResponse(subscription);
  }

  async getForStudent(
    studentUserId: string,
    subscriptionId: string,
  ): Promise<SubscriptionResponse> {
    const { subscription } = await this.ensureStudentOwnsSubscription(studentUserId, subscriptionId);
    return toResponse(subscription);
  }

  async updateAsAdmin(
    subscriptionId: string,
    payload: UpdateSubscriptionInput,
  ): Promise<SubscriptionResponse> {
    const subscription = await this.getSubscriptionById(subscriptionId);

    let ownerType = subscription.ownerType;
    let ownerId = subscription.ownerId;

    if (payload.ownerType) {
      ownerType = payload.ownerType;
    }

    if (payload.ownerId) {
      ownerId = payload.ownerId;
    }

    if (payload.ownerType || payload.ownerId) {
      await this.validateOwner(ownerType, ownerId);
    }

    const data: Record<string, unknown> = {};

    if (payload.ownerType || payload.ownerId) {
      data.ownerType = ownerType;
      data.ownerId = ownerId;
    }

    if (payload.planType !== undefined) {
      data.planType = payload.planType;
    }

    if (payload.status !== undefined) {
      data.status = payload.status;
    }

    if (payload.startsAt !== undefined) {
      data.startsAt = new Date(payload.startsAt);
    }

    if (payload.endsAt !== undefined) {
      data.endsAt = new Date(payload.endsAt);
    }

    const updated = (await prisma.subscription.update({
      where: { id: subscriptionId },
      data,
    })) as SubscriptionEntity;

    return toResponse(updated);
  }

  async updateAsTrainer(
    trainerUserId: string,
    subscriptionId: string,
    payload: UpdateSubscriptionInput,
  ): Promise<SubscriptionResponse> {
    if (payload.ownerType !== undefined || payload.ownerId !== undefined) {
      throw new AppError(403, 'Trainers cannot change subscription ownership');
    }

    const { subscription } = await this.ensureTrainerOwnsSubscription(trainerUserId, subscriptionId);

    const data: Record<string, unknown> = {};

    if (payload.planType !== undefined) {
      data.planType = payload.planType;
    }

    if (payload.status !== undefined) {
      data.status = payload.status;
    }

    if (payload.startsAt !== undefined) {
      data.startsAt = new Date(payload.startsAt);
    }

    if (payload.endsAt !== undefined) {
      data.endsAt = new Date(payload.endsAt);
    }

    const updated = (await prisma.subscription.update({
      where: { id: subscription.id },
      data,
    })) as SubscriptionEntity;

    return toResponse(updated);
  }

  async updateAsStudent(
    studentUserId: string,
    subscriptionId: string,
    payload: UpdateSubscriptionAsStudentInput,
  ): Promise<SubscriptionResponse> {
    const { subscription } = await this.ensureStudentOwnsSubscription(studentUserId, subscriptionId);

    const data: Record<string, unknown> = {};

    if (payload.planType !== undefined) {
      data.planType = payload.planType;
    }

    if (payload.status !== undefined) {
      data.status = payload.status;
    }

    if (payload.startsAt !== undefined) {
      data.startsAt = new Date(payload.startsAt);
    }

    if (payload.endsAt !== undefined) {
      data.endsAt = new Date(payload.endsAt);
    }

    const updated = (await prisma.subscription.update({
      where: { id: subscription.id },
      data,
    })) as SubscriptionEntity;

    return toResponse(updated);
  }

  async deleteAsAdmin(subscriptionId: string): Promise<void> {
    await this.getSubscriptionById(subscriptionId);
    await prisma.subscription.delete({ where: { id: subscriptionId } });
  }

  async deleteAsTrainer(trainerUserId: string, subscriptionId: string): Promise<void> {
    const { subscription } = await this.ensureTrainerOwnsSubscription(trainerUserId, subscriptionId);
    await prisma.subscription.delete({ where: { id: subscription.id } });
  }
}

export const subscriptionService = new SubscriptionService();
