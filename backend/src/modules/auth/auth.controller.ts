import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { authService } from './auth.service';
import { AuthCredentials, UserRole } from './auth.types';

export class AuthController {
  async register(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role, name } = req.body as AuthCredentials & { role: UserRole; name: string };

    try {
      const result = await authService.register({ email, password, role, name });
      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }

  async login(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body as AuthCredentials;

    try {
      const result = await authService.login({ email, password });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(401).json({ message: (error as Error).message });
    }
  }
}

export const authController = new AuthController();
