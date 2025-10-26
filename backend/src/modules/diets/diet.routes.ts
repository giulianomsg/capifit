import { Router } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { dietController } from './diet.controller';

const router = Router();

router.get('/student/:studentId', authGuard(['trainer', 'student']), (req, res) => dietController.list(req, res));
router.post('/', authGuard(['trainer']), (req, res) => dietController.create(req, res));
router.put('/:id', authGuard(['trainer']), (req, res) => dietController.update(req, res));

export default router;
