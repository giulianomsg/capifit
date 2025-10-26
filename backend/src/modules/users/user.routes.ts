import { Router } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { userController } from './user.controller';

const router = Router();

router.get('/', authGuard(['admin']), (req, res) => userController.list(req, res));
router.post('/', authGuard(['admin']), (req, res) => userController.create(req, res));
router.get('/:id', authGuard(['admin', 'trainer', 'student']), (req, res) => userController.getById(req, res));
router.put('/:id', authGuard(['admin', 'trainer', 'student']), (req, res) => userController.update(req, res));

export default router;
