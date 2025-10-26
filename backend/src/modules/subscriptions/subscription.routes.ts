import { Router } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { subscriptionController } from './subscription.controller';

const router = Router();

router.get('/plans', authGuard(['admin']), (req, res) => subscriptionController.listPlans(req, res));
router.post('/plans', authGuard(['admin']), (req, res) => subscriptionController.createPlan(req, res));
router.get('/trainer/:trainerId', authGuard(['trainer']), (req, res) => subscriptionController.listContracts(req, res));
router.post('/contracts', authGuard(['trainer']), (req, res) => subscriptionController.createContract(req, res));

export default router;
