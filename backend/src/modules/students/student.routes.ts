import { Router } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { studentController } from './student.controller';

const router = Router();

router.get('/trainer/:trainerId', authGuard(['trainer']), (req, res) => studentController.listByTrainer(req, res));
router.post('/', authGuard(['trainer']), (req, res) => studentController.create(req, res));
router.put('/:id', authGuard(['trainer']), (req, res) => studentController.update(req, res));

export default router;
