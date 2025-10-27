import { Request, Response } from 'express';
import { AppError } from '../../errors/AppError';
import {
  createWorkoutSchema,
  updateWorkoutSchema,
} from './workout.types';
import { workoutService } from './workout.service';

export class WorkoutController {
  async list(req: Request, res: Response) {
    const user = req.user!;
    const { studentId } = req.params;

    try {
      if (user.role === 'admin') {
        const workouts = await workoutService.listForAdmin(studentId);
        return res.json({ data: workouts });
      }

      if (user.role === 'trainer') {
        const workouts = await workoutService.listForTrainer(user.id, studentId);
        return res.json({ data: workouts });
      }

      if (user.role === 'student') {
        const workouts = await workoutService.listForStudent(user.id, studentId);
        return res.json({ data: workouts });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async create(req: Request, res: Response) {
    const user = req.user!;
    const { studentId } = req.params;
    const parsed = createWorkoutSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    try {
      const workout = await workoutService.createForTrainer(user.id, studentId, parsed.data);
      return res.status(201).json({ data: workout });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async show(req: Request, res: Response) {
    const user = req.user!;
    const { id } = req.params;

    try {
      if (user.role === 'admin') {
        const workout = await workoutService.getForAdmin(id);
        return res.json({ data: workout });
      }

      if (user.role === 'trainer') {
        const workout = await workoutService.getForTrainer(user.id, id);
        return res.json({ data: workout });
      }

      if (user.role === 'student') {
        const workout = await workoutService.getForStudent(user.id, id);
        return res.json({ data: workout });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    const user = req.user!;
    const { id } = req.params;
    const parsed = updateWorkoutSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    try {
      const workout = await workoutService.updateForTrainer(user.id, id, parsed.data);
      return res.json({ data: workout });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    const user = req.user!;
    const { id } = req.params;

    try {
      await workoutService.deleteForTrainer(user.id, id);
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

export const workoutController = new WorkoutController();
