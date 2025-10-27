// src/modules/users/user.routes.ts
import { Router, Request, Response } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { userController } from './user.controller';

const router = Router();

router.get('/', authGuard(['admin']), (req: Request, res: Response) => {
  return userController.list(req, res);
});

router.post('/', authGuard(['admin']), (req: Request, res: Response) => {
  return userController.create(req, res);
});

router.get('/:id', authGuard(['admin', 'trainer', 'student']), (req: Request, res: Response) => {
  return userController.getById(req, res);
});

router.put('/:id', authGuard(['admin', 'trainer', 'student']), (req: Request, res: Response) => {
  return userController.update(req, res);
});

export default router;
