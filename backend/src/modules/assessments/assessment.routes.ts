// src/modules/assessments/assessment.routes.ts
import { Router, Request, Response } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { assessmentController } from './assessment.controller';

const router = Router();

router.get('/physical/:studentId', authGuard(['trainer', 'student']), (req: Request, res: Response) => {
  return assessmentController.listPhysical(req, res);
});

router.get('/snapshots/:studentId', authGuard(['trainer', 'student']), (req: Request, res: Response) => {
  return assessmentController.listSnapshots(req, res);
});

router.post('/physical', authGuard(['trainer']), (req: Request, res: Response) => {
  return assessmentController.createPhysical(req, res);
});

router.post('/snapshots', authGuard(['trainer', 'student']), (req: Request, res: Response) => {
  return assessmentController.createSnapshot(req, res);
});

export default router;
