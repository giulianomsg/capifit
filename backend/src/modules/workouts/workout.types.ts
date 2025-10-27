import { z } from 'zod';

const jsonSchema = z
  .unknown()
  .refine(
    (value) => typeof value === 'object' && value !== null,
    { message: 'planJson must be an object or array' },
  );

export const createWorkoutSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  planJson: jsonSchema,
  startDate: z
    .string()
    .datetime({ message: 'startDate must be a valid ISO date' })
    .optional(),
  endDate: z
    .string()
    .datetime({ message: 'endDate must be a valid ISO date' })
    .optional(),
});

export const updateWorkoutSchema = z
  .object({
    title: z.string().min(1, 'Title is required').optional(),
    planJson: jsonSchema.optional(),
    startDate: z
      .string()
      .datetime({ message: 'startDate must be a valid ISO date' })
      .optional(),
    endDate: z
      .string()
      .datetime({ message: 'endDate must be a valid ISO date' })
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export interface CreateWorkoutInput {
  title: string;
  planJson: unknown;
  startDate?: string;
  endDate?: string;
}

export interface UpdateWorkoutInput {
  title?: string;
  planJson?: unknown;
  startDate?: string;
  endDate?: string;
}

export interface WorkoutResponse {
  id: string;
  studentId: string;
  title: string;
  planJson: unknown;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}
