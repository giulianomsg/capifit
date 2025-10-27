import { z } from 'zod';

const measurementValue = z
  .number()
  .nonnegative('Measurements cannot be negative')
  .optional();

export const metricsSchema = z.object({
  weight: z.number().positive('Weight must be greater than zero'),
  bodyFat: z
    .number()
    .min(0, 'Body fat cannot be negative')
    .max(100, 'Body fat cannot exceed 100%'),
  muscleMass: z.number().nonnegative('Muscle mass cannot be negative').optional(),
  chest: measurementValue,
  waist: measurementValue,
  hips: measurementValue,
  thigh: measurementValue,
  arm: measurementValue,
});

export const createAssessmentSchema = z.object({
  metricsJson: metricsSchema,
  date: z.string().datetime({ message: 'date must be a valid ISO date' }),
});

export const updateAssessmentSchema = z
  .object({
    metricsJson: metricsSchema.optional(),
    date: z
      .string()
      .datetime({ message: 'date must be a valid ISO date' })
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export interface Metrics {
  weight: number;
  bodyFat: number;
  muscleMass?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  thigh?: number;
  arm?: number;
}

export interface CreateAssessmentInput {
  metricsJson: Metrics;
  date: string;
}

export interface UpdateAssessmentInput {
  metricsJson?: Metrics;
  date?: string;
}

export interface AssessmentResponse {
  id: string;
  studentId: string;
  trainerId: string;
  metricsJson: Metrics;
  date: string;
  createdAt: string;
}
