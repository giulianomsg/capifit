import { Request, Response } from 'express';
import { subscriptionService } from './subscription.service';

export class SubscriptionController {
  listPlans(_req: Request, res: Response) {
    return res.json(subscriptionService.listPlans());
  }

  createPlan(req: Request, res: Response) {
    try {
      const plan = subscriptionService.createPlan(req.body);
      return res.status(201).json(plan);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }

  listContracts(req: Request, res: Response) {
    const trainerId = req.params.trainerId;
    return res.json(subscriptionService.listContractsByTrainer(trainerId));
  }

  createContract(req: Request, res: Response) {
    try {
      const contract = subscriptionService.createContract(req.body);
      return res.status(201).json(contract);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }
}

export const subscriptionController = new SubscriptionController();
