import { z } from 'zod';

export const subscriptionOwnerTypeValues = ['TRAINER', 'STUDENT'] as const;
export const subscriptionPlanTypeValues = ['MONTHLY', 'ANNUAL'] as const;
export const subscriptionStatusValues = ['TRIAL', 'ACTIVE', 'OVERDUE', 'CANCELED'] as const;

export const subscriptionQuerySchema = z.object({
  ownerType: z.enum(subscriptionOwnerTypeValues).optional(),
  ownerId: z.string().min(1, 'ownerId is required').optional(),
});

export const createSubscriptionSchema = z.object({
  ownerType: z.enum(subscriptionOwnerTypeValues),
  ownerId: z.string().min(1, 'ownerId is required'),
  planType: z.enum(subscriptionPlanTypeValues),
  status: z.enum(subscriptionStatusValues),
  startsAt: z.string().datetime({ message: 'startsAt must be a valid ISO date' }),
  endsAt: z.string().datetime({ message: 'endsAt must be a valid ISO date' }),
});

export const updateSubscriptionSchema = z
  .object({
    ownerType: z.enum(subscriptionOwnerTypeValues).optional(),
    ownerId: z.string().min(1, 'ownerId is required').optional(),
    planType: z.enum(subscriptionPlanTypeValues).optional(),
    status: z.enum(subscriptionStatusValues).optional(),
    startsAt: z.string().datetime({ message: 'startsAt must be a valid ISO date' }).optional(),
    endsAt: z.string().datetime({ message: 'endsAt must be a valid ISO date' }).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export const updateSubscriptionAsStudentSchema = z
  .object({
    status: z.enum(subscriptionStatusValues).optional(),
    planType: z.enum(subscriptionPlanTypeValues).optional(),
    startsAt: z.string().datetime({ message: 'startsAt must be a valid ISO date' }).optional(),
    endsAt: z.string().datetime({ message: 'endsAt must be a valid ISO date' }).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export type SubscriptionOwnerType = (typeof subscriptionOwnerTypeValues)[number];
export type SubscriptionPlanType = (typeof subscriptionPlanTypeValues)[number];
export type SubscriptionStatus = (typeof subscriptionStatusValues)[number];

export interface SubscriptionResponse {
  id: string;
  ownerType: SubscriptionOwnerType;
  ownerId: string;
  planType: SubscriptionPlanType;
  status: SubscriptionStatus;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateSubscriptionInput = {
  ownerType: SubscriptionOwnerType;
  ownerId: string;
  planType: SubscriptionPlanType;
  status: SubscriptionStatus;
  startsAt: string;
  endsAt: string;
};

export type UpdateSubscriptionInput = Partial<{
  ownerType: SubscriptionOwnerType;
  ownerId: string;
  planType: SubscriptionPlanType;
  status: SubscriptionStatus;
  startsAt: string;
  endsAt: string;
}>;

export type UpdateSubscriptionAsStudentInput = Partial<{
  planType: SubscriptionPlanType;
  status: SubscriptionStatus;
  startsAt: string;
  endsAt: string;
}>;

export type SubscriptionQueryInput = {
  ownerType?: SubscriptionOwnerType;
  ownerId?: string;
};
