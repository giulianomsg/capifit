// src/modules/subscriptions/subscription.routes.ts
import { Router, Request, Response } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { subscriptionController } from './subscription.controller';

const router = Router();

router.get('/plans', authGuard(['admin']), (req: Request, res: Response) => {
  return subscriptionController.listPlans(req, res);
});

router.post('/plans', authGuard(['admin']), (req: Request, res: Response) => {
  return subscriptionController.createPlan(req, res);
});

router.get('/trainer/:trainerId', authGuard(['trainer']), (req: Request, res: Response) => {
  return subscriptionController.listContracts(req, res);
});

router.post('/contracts', authGuard(['trainer']), (req: Request, res: Response) => {
  return subscriptionController.createContract(req, res);
});

export default router;
