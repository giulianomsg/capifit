import { Request, Response } from 'express';
import { workoutService } from './workout.service';

export class WorkoutController {
  list(req: Request, res: Response) {
    const studentId = req.params.studentId;
    return res.json(workoutService.listByStudent(studentId));
  }

  create(req: Request, res: Response) {
    try {
      const plan = workoutService.create(req.body);
      return res.status(201).json(plan);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }

  update(req: Request, res: Response) {
    try {
      const plan = workoutService.update(req.params.id, req.body);
      return res.json(plan);
    } catch (error) {
      return res.status(404).json({ message: (error as Error).message });
    }
  }
}

export const workoutController = new WorkoutController();
