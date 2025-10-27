import { Router, Request, Response } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { messageController } from './message.controller';

const router = Router();

router.use(authGuard());

router.get(
  '/conversations/:studentId',
  roleGuard(['admin', 'trainer', 'student']),
  (req: Request, res: Response) => messageController.listConversation(req, res),
);

router.post(
  '/conversations/:studentId/messages',
  roleGuard(['trainer', 'student']),
  (req: Request, res: Response) => messageController.sendMessage(req, res),
);

export default router;
