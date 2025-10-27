import { Request, Response } from 'express';
import {
  createStudentSchema,
  updateStudentByTrainerSchema,
  updateStudentSelfSchema,
} from './student.types';
import { studentService } from './student.service';
import { AppError } from '../../errors/AppError';

export class StudentController {
  async list(req: Request, res: Response) {
    const user = req.user!;

    try {
      if (user.role === 'admin') {
        const students = await studentService.listAll();
        return res.json({ data: students });
      }

      if (user.role === 'trainer') {
        const students = await studentService.listForTrainer(user.id);
        return res.json({ data: students });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async create(req: Request, res: Response) {
    const user = req.user!;

    const parsed = createStudentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    try {
      const student = await studentService.createForTrainer(user.id, parsed.data);
      return res.status(201).json({ data: student });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async show(req: Request, res: Response) {
    const user = req.user!;
    const { id } = req.params;

    try {
      if (user.role === 'admin') {
        const student = await studentService.getForAdmin(id);
        return res.json({ data: student });
      }

      if (user.role === 'trainer') {
        const student = await studentService.getForTrainer(user.id, id);
        return res.json({ data: student });
      }

      if (user.role === 'student') {
        const student = await studentService.getOwnProfile(user.id, id);
        return res.json({ data: student });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    const user = req.user!;
    const { id } = req.params;

    try {
      if (user.role === 'trainer') {
        const parsed = updateStudentByTrainerSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(422).json({ errors: parsed.error.flatten() });
        }

        const student = await studentService.updateForTrainer(user.id, id, parsed.data);
        return res.json({ data: student });
      }

      if (user.role === 'student') {
        const parsed = updateStudentSelfSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(422).json({ errors: parsed.error.flatten() });
        }

        const student = await studentService.updateOwnProfile(user.id, id, parsed.data);
        return res.json({ data: student });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    const user = req.user!;
    const { id } = req.params;

    try {
      if (user.role === 'trainer') {
        await studentService.deleteForTrainer(user.id, id);
        return res.status(204).send();
      }

      if (user.role === 'admin') {
        await studentService.deleteAsAdmin(id);
        return res.status(204).send();
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

export const studentController = new StudentController();
