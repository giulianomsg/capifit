import { Router, Request, Response } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { workoutController } from './workout.controller';

const router = Router();

router.use(authGuard());

router.get(
  '/students/:studentId/workouts',
  roleGuard(['admin', 'trainer', 'student']),
  (req: Request, res: Response) => workoutController.list(req, res),
);

router.post(
  '/students/:studentId/workouts',
  roleGuard(['trainer']),
  (req: Request, res: Response) => workoutController.create(req, res),
);

router.get(
  '/workouts/:id',
  roleGuard(['admin', 'trainer', 'student']),
  (req: Request, res: Response) => workoutController.show(req, res),
);

router.patch(
  '/workouts/:id',
  roleGuard(['trainer']),
  (req: Request, res: Response) => workoutController.update(req, res),
);

router.delete(
  '/workouts/:id',
  roleGuard(['trainer']),
  (req: Request, res: Response) => workoutController.remove(req, res),
);

export default router;
