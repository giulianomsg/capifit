import { z } from 'zod';

export const createStudentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must have at least 6 characters'),
  isActive: z.boolean().optional(),
});

export const updateStudentByTrainerSchema = z
  .object({
    name: z.string().min(1, 'Name is required').optional(),
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(6, 'Password must have at least 6 characters').optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value: Record<string, unknown>) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export const updateStudentSelfSchema = z
  .object({
    name: z.string().min(1, 'Name is required').optional(),
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(6, 'Password must have at least 6 characters').optional(),
  })
  .refine((value: Record<string, unknown>) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateStudentInput = {
  name: string;
  email: string;
  password: string;
  isActive?: boolean;
};

export type UpdateStudentByTrainerInput = {
  name?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
};

export type UpdateStudentSelfInput = {
  name?: string;
  email?: string;
  password?: string;
};
