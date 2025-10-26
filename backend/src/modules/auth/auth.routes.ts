import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from './auth.controller';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['admin', 'trainer', 'student']),
    body('name').notEmpty()
  ],
  (req, res) => authController.register(req, res)
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').isLength({ min: 6 })],
  (req, res) => authController.login(req, res)
);

export default router;
