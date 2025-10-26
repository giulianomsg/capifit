// src/modules/trainers/trainer.routes.ts
import { Router, Request, Response } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { trainerController } from './trainer.controller';

const router = Router();

router.get('/', authGuard(['admin']), (req: Request, res: Response) => {
  return trainerController.list(req, res);
});

router.post('/', authGuard(['admin']), (req: Request, res: Response) => {
  return trainerController.create(req, res);
});

router.put('/:id', authGuard(['admin', 'trainer']), (req: Request, res: Response) => {
  return trainerController.update(req, res);
});

export default router;
