import { Router } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { assessmentController } from './assessment.controller';

const router = Router();

router.get('/physical/:studentId', authGuard(['trainer', 'student']), (req, res) => assessmentController.listPhysical(req, res));
router.get('/snapshots/:studentId', authGuard(['trainer', 'student']), (req, res) => assessmentController.listSnapshots(req, res));
router.post('/physical', authGuard(['trainer']), (req, res) => assessmentController.createPhysical(req, res));
router.post('/snapshots', authGuard(['trainer', 'student']), (req, res) => assessmentController.createSnapshot(req, res));

export default router;
