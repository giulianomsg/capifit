import { z } from 'zod';

const jsonSchema = z
  .unknown()
  .refine(
    (value) => typeof value === 'object' && value !== null,
    { message: 'planJson must be an object or array' },
  );

export const createDietSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  planJson: jsonSchema,
  calories: z.number().int('calories must be an integer').nonnegative('calories cannot be negative').optional(),
  macrosJson: jsonSchema.optional(),
});

export const updateDietSchema = z
  .object({
    title: z.string().min(1, 'Title is required').optional(),
    planJson: jsonSchema.optional(),
    calories: z.number().int('calories must be an integer').nonnegative('calories cannot be negative').optional(),
    macrosJson: jsonSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export interface CreateDietInput {
  title: string;
  planJson: unknown;
  calories?: number;
  macrosJson?: unknown;
}

export interface UpdateDietInput {
  title?: string;
  planJson?: unknown;
  calories?: number;
  macrosJson?: unknown;
}

export interface DietResponse {
  id: string;
  studentId: string;
  title: string;
  planJson: unknown;
  calories: number | null;
  macrosJson: unknown | null;
  createdAt: string;
}
