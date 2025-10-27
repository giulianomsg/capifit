// src/modules/communications/communication.routes.ts
import { Router, Request, Response } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { communicationController } from './communication.controller';

const router = Router();

router.get('/messages/:roomId', authGuard(['trainer', 'student']), (req: Request, res: Response) => {
  return communicationController.listMessages(req, res);
});

router.post('/messages', authGuard(['trainer', 'student']), (req: Request, res: Response) => {
  return communicationController.sendMessage(req, res);
});

router.get('/notifications/:userId', authGuard(['admin', 'trainer', 'student']), (req: Request, res: Response) => {
  return communicationController.listNotifications(req, res);
});

router.post('/notifications', authGuard(['admin']), (req: Request, res: Response) => {
  return communicationController.createNotification(req, res);
});

export default router;
