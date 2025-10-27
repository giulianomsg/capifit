import { NextFunction, Request, Response } from 'express';

export type AllowedRole = 'admin' | 'trainer' | 'student';

export const roleGuard = (roles: AllowedRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role as AllowedRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
};
