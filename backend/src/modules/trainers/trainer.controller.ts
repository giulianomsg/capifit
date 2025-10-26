import { Request, Response } from 'express';
import { trainerService } from './trainer.service';

export class TrainerController {
  list(_req: Request, res: Response) {
    return res.json(trainerService.list());
  }

  create(req: Request, res: Response) {
    try {
      const trainer = trainerService.create(req.body);
      return res.status(201).json(trainer);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }

  update(req: Request, res: Response) {
    try {
      const trainer = trainerService.update(req.params.id, req.body);
      return res.json(trainer);
    } catch (error) {
      return res.status(404).json({ message: (error as Error).message });
    }
  }
}

export const trainerController = new TrainerController();
