import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; role: string };
  }
}

export function authGuard(requiredRoles: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { id: string; role: string };
      req.user = payload;

      if (requiredRoles.length && !requiredRoles.includes(payload.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token', details: (error as Error).message });
    }
  };
}
