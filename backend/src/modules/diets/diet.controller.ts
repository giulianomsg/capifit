import { Request, Response } from 'express';
import { AppError } from '../../errors/AppError';
import { dietService } from './diet.service';
import { createDietSchema, updateDietSchema } from './diet.types';

export class DietController {
  async list(req: Request, res: Response) {
    const user = req.user!;
    const { studentId } = req.params;

    try {
      if (user.role === 'admin') {
        const diets = await dietService.listForAdmin(studentId);
        return res.json({ data: diets });
      }

      if (user.role === 'trainer') {
        const diets = await dietService.listForTrainer(user.id, studentId);
        return res.json({ data: diets });
      }

      if (user.role === 'student') {
        const diets = await dietService.listForStudent(user.id, studentId);
        return res.json({ data: diets });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async create(req: Request, res: Response) {
    const user = req.user!;
    const { studentId } = req.params;
    const parsed = createDietSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    try {
      const diet = await dietService.createForTrainer(user.id, studentId, parsed.data);
      return res.status(201).json({ data: diet });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async show(req: Request, res: Response) {
    const user = req.user!;
    const { id } = req.params;

    try {
      if (user.role === 'admin') {
        const diet = await dietService.getForAdmin(id);
        return res.json({ data: diet });
      }

      if (user.role === 'trainer') {
        const diet = await dietService.getForTrainer(user.id, id);
        return res.json({ data: diet });
      }

      if (user.role === 'student') {
        const diet = await dietService.getForStudent(user.id, id);
        return res.json({ data: diet });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    const user = req.user!;
    const { id } = req.params;
    const parsed = updateDietSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    try {
      const diet = await dietService.updateForTrainer(user.id, id, parsed.data);
      return res.json({ data: diet });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    const user = req.user!;
    const { id } = req.params;

    try {
      await dietService.deleteForTrainer(user.id, id);
      return res.status(204).send();
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

export const dietController = new DietController();
