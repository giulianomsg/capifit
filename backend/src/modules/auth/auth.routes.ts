// src/modules/auth/auth.routes.ts
import { Router, Request, Response } from 'express';
import { AuthController } from './auth.controller';

const router = Router();
const authController = new AuthController();

router.post('/register', (req: Request, res: Response) => {
  return authController.register(req, res);
});

router.post('/login', (req: Request, res: Response) => {
  return authController.login(req, res);
});

export default router;
