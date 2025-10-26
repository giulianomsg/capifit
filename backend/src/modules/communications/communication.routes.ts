import { Router } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { communicationController } from './communication.controller';

const router = Router();

router.get('/messages/:roomId', authGuard(['trainer', 'student']), (req, res) => communicationController.listMessages(req, res));
router.post('/messages', authGuard(['trainer', 'student']), (req, res) => communicationController.sendMessage(req, res));
router.get('/notifications/:userId', authGuard(['admin', 'trainer', 'student']), (req, res) => communicationController.listNotifications(req, res));
router.post('/notifications', authGuard(['admin']), (req, res) => communicationController.createNotification(req, res));

export default router;
