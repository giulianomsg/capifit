import { Router, Request, Response } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { assessmentController } from './assessment.controller';

const router = Router();

router.use(authGuard());

router.get(
  '/students/:studentId/assessments',
  roleGuard(['admin', 'trainer', 'student']),
  (req: Request, res: Response) => assessmentController.list(req, res),
);

router.post(
  '/students/:studentId/assessments',
  roleGuard(['trainer']),
  (req: Request, res: Response) => assessmentController.create(req, res),
);

router.get(
  '/assessments/:id',
  roleGuard(['admin', 'trainer', 'student']),
  (req: Request, res: Response) => assessmentController.show(req, res),
);

router.patch(
  '/assessments/:id',
  roleGuard(['trainer']),
  (req: Request, res: Response) => assessmentController.update(req, res),
);

router.delete(
  '/assessments/:id',
  roleGuard(['trainer']),
  (req: Request, res: Response) => assessmentController.remove(req, res),
);

export default router;
