import { Router, Request, Response } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import upload from '../../config/upload';
import { mediaController } from './media.controller';

const router = Router();

router.use(authGuard());

router.get(
  '/students/:studentId/media',
  roleGuard(['admin', 'trainer', 'student']),
  (req: Request, res: Response) => mediaController.list(req, res),
);

router.post(
  '/students/:studentId/media',
  roleGuard(['trainer', 'student']),
  upload.single('file'),
  (req: Request, res: Response) => mediaController.upload(req, res),
);

export default router;
