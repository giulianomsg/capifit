// src/modules/workouts/workout.routes.ts
import { Router, Request, Response } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { workoutController } from './workout.controller';

const router = Router();

router.get('/student/:studentId', authGuard(['trainer', 'student']), (req: Request, res: Response) => {
  return workoutController.list(req, res);
});

router.post('/', authGuard(['trainer']), (req: Request, res: Response) => {
  return workoutController.create(req, res);
});

router.put('/:id', authGuard(['trainer']), (req: Request, res: Response) => {
  return workoutController.update(req, res);
});

export default router;
