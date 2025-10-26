import { Router } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { trainerController } from './trainer.controller';

const router = Router();

router.get('/', authGuard(['admin']), (req, res) => trainerController.list(req, res));
router.post('/', authGuard(['admin']), (req, res) => trainerController.create(req, res));
router.put('/:id', authGuard(['admin', 'trainer']), (req, res) => trainerController.update(req, res));

export default router;
