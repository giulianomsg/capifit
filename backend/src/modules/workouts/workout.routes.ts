import { Router } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { workoutController } from './workout.controller';

const router = Router();

router.get('/student/:studentId', authGuard(['trainer', 'student']), (req, res) => workoutController.list(req, res));
router.post('/', authGuard(['trainer']), (req, res) => workoutController.create(req, res));
router.put('/:id', authGuard(['trainer']), (req, res) => workoutController.update(req, res));

export default router;
