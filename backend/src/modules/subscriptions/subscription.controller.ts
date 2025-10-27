import { Request, Response } from 'express';
import { AppError } from '../../errors/AppError';
import { subscriptionService } from './subscription.service';
import {
  createSubscriptionSchema,
  subscriptionQuerySchema,
  updateSubscriptionAsStudentSchema,
  updateSubscriptionSchema,
} from './subscription.types';

const extractQueryValue = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return typeof value === 'string' ? value : undefined;
};

export class SubscriptionController {
  async list(req: Request, res: Response) {
    const user = req.user!;
    const parsed = subscriptionQuerySchema.safeParse({
      ownerType: extractQueryValue(req.query.ownerType),
      ownerId: extractQueryValue(req.query.ownerId),
    });

    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    try {
      if (user.role === 'admin') {
        const subscriptions = await subscriptionService.listForAdmin(parsed.data);
        return res.json({ data: subscriptions });
      }

      if (user.role === 'trainer') {
        const subscriptions = await subscriptionService.listForTrainer(user.id, parsed.data);
        return res.json({ data: subscriptions });
      }

      if (user.role === 'student') {
        const subscriptions = await subscriptionService.listForStudent(user.id, parsed.data);
        return res.json({ data: subscriptions });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async create(req: Request, res: Response) {
    const user = req.user!;
    const parsed = createSubscriptionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    try {
      if (user.role === 'admin') {
        const subscription = await subscriptionService.createAsAdmin(parsed.data);
        return res.status(201).json({ data: subscription });
      }

      if (user.role === 'trainer') {
        const subscription = await subscriptionService.createAsTrainer(user.id, parsed.data);
        return res.status(201).json({ data: subscription });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async show(req: Request, res: Response) {
    const user = req.user!;
    const { id } = req.params;

    try {
      if (user.role === 'admin') {
        const subscription = await subscriptionService.getForAdmin(id);
        return res.json({ data: subscription });
      }

      if (user.role === 'trainer') {
        const subscription = await subscriptionService.getForTrainer(user.id, id);
        return res.json({ data: subscription });
      }

      if (user.role === 'student') {
        const subscription = await subscriptionService.getForStudent(user.id, id);
        return res.json({ data: subscription });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    const user = req.user!;
    const { id } = req.params;

    if (user.role === 'student') {
      const parsed = updateSubscriptionAsStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(422).json({ errors: parsed.error.flatten() });
      }

      try {
        const subscription = await subscriptionService.updateAsStudent(user.id, id, parsed.data);
        return res.json({ data: subscription });
      } catch (error) {
        return this.handleError(res, error);
      }
    }

    const parsed = updateSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    try {
      if (user.role === 'admin') {
        const subscription = await subscriptionService.updateAsAdmin(id, parsed.data);
        return res.json({ data: subscription });
      }

      if (user.role === 'trainer') {
        const subscription = await subscriptionService.updateAsTrainer(user.id, id, parsed.data);
        return res.json({ data: subscription });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    const user = req.user!;
    const { id } = req.params;

    try {
      if (user.role === 'admin') {
        await subscriptionService.deleteAsAdmin(id);
        return res.status(204).send();
      }

      if (user.role === 'trainer') {
        await subscriptionService.deleteAsTrainer(user.id, id);
        return res.status(204).send();
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  private handleError(res: Response, error: unknown) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export const subscriptionController = new SubscriptionController();
