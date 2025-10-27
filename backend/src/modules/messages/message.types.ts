import { z } from 'zod';

export const createMessageSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

export interface CreateMessageInput {
  content: string;
}

export interface MessageResponse {
  id: string;
  studentId: string;
  trainerId: string;
  fromRole: 'TRAINER' | 'STUDENT';
  content: string;
  createdAt: string;
}
