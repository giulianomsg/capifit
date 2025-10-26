// src/modules/diets/diet.routes.ts
import { Router, Request, Response } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { dietController } from './diet.controller';

const router = Router();

router.get('/student/:studentId', authGuard(['trainer', 'student']), (req: Request, res: Response) => {
  return dietController.list(req, res);
});

router.post('/', authGuard(['trainer']), (req: Request, res: Response) => {
  return dietController.create(req, res);
});

router.put('/:id', authGuard(['trainer']), (req: Request, res: Response) => {
  return dietController.update(req, res);
});

export default router;
