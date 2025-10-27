import { Router, Request, Response } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { dietController } from './diet.controller';

const router = Router();

router.use(authGuard());

router.get(
  '/students/:studentId/diets',
  roleGuard(['admin', 'trainer', 'student']),
  (req: Request, res: Response) => dietController.list(req, res),
);

router.post(
  '/students/:studentId/diets',
  roleGuard(['trainer']),
  (req: Request, res: Response) => dietController.create(req, res),
);

router.get(
  '/diets/:id',
  roleGuard(['admin', 'trainer', 'student']),
  (req: Request, res: Response) => dietController.show(req, res),
);

router.patch(
  '/diets/:id',
  roleGuard(['trainer']),
  (req: Request, res: Response) => dietController.update(req, res),
);

router.delete(
  '/diets/:id',
  roleGuard(['trainer']),
  (req: Request, res: Response) => dietController.remove(req, res),
);

export default router;
