import { z } from 'zod';

export const mediaTypeValues = ['PHOTO', 'EXAM'] as const;

export const createMediaSchema = z.object({
  type: z.enum(mediaTypeValues, {
    errorMap: () => ({ message: 'type must be PHOTO or EXAM' }),
  }),
});

export type CreateMediaInput = {
  type: (typeof mediaTypeValues)[number];
};

export interface UploadedFileInfo {
  path: string;
  filename: string;
  mimetype: string;
  size: number;
  originalname: string;
}

export interface MediaResponse {
  id: string;
  studentId: string;
  type: 'PHOTO' | 'EXAM';
  path: string;
  createdAt: string;
}
