import { Request, Response } from 'express';
import { AppError } from '../../errors/AppError';
import { createMediaSchema } from './media.types';
import { mediaService } from './media.service';

export class MediaController {
  async list(req: Request, res: Response) {
    const user = req.user!;
    const { studentId } = req.params;

    try {
      if (user.role === 'admin') {
        const media = await mediaService.listForAdmin(studentId);
        return res.json({ data: media });
      }

      if (user.role === 'trainer') {
        const media = await mediaService.listForTrainer(user.id, studentId);
        return res.json({ data: media });
      }

      if (user.role === 'student') {
        const media = await mediaService.listForStudent(user.id, studentId);
        return res.json({ data: media });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async upload(req: Request, res: Response) {
    const user = req.user!;
    const { studentId } = req.params;
    const parsed = createMediaSchema.safeParse(req.body);

    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    try {
      if (user.role === 'trainer') {
        const media = await mediaService.createForTrainer(user.id, studentId, parsed.data, req.file);
        return res.status(201).json({ data: media });
      }

      if (user.role === 'student') {
        const media = await mediaService.createForStudent(user.id, studentId, parsed.data, req.file);
        return res.status(201).json({ data: media });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  private handleError(res: Response, error: unknown) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export const mediaController = new MediaController();
