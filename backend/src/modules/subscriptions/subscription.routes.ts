import { Router, Request, Response } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { subscriptionController } from './subscription.controller';

const router = Router();

router.use(authGuard());

router.get(
  '/subscriptions',
  roleGuard(['admin', 'trainer', 'student']),
  (req: Request, res: Response) => subscriptionController.list(req, res),
);

router.post(
  '/subscriptions',
  roleGuard(['admin', 'trainer']),
  (req: Request, res: Response) => subscriptionController.create(req, res),
);

router.get(
  '/subscriptions/:id',
  roleGuard(['admin', 'trainer', 'student']),
  (req: Request, res: Response) => subscriptionController.show(req, res),
);

router.patch(
  '/subscriptions/:id',
  roleGuard(['admin', 'trainer', 'student']),
  (req: Request, res: Response) => subscriptionController.update(req, res),
);

router.delete(
  '/subscriptions/:id',
  roleGuard(['admin', 'trainer']),
  (req: Request, res: Response) => subscriptionController.remove(req, res),
);

export default router;
