// src/modules/students/student.routes.ts
import { Router, Request, Response } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { studentController } from './student.controller';

const router = Router();

router.get('/trainer/:trainerId', authGuard(['trainer']), (req: Request, res: Response) => {
  return studentController.listByTrainer(req, res);
});

router.post('/', authGuard(['trainer']), (req: Request, res: Response) => {
  return studentController.create(req, res);
});

router.put('/:id', authGuard(['trainer']), (req: Request, res: Response) => {
  return studentController.update(req, res);
});

export default router;
