import { Request, Response } from 'express';
import { dietService } from './diet.service';

export class DietController {
  list(req: Request, res: Response) {
    const studentId = req.params.studentId;
    return res.json(dietService.listByStudent(studentId));
  }

  create(req: Request, res: Response) {
    try {
      const plan = dietService.create(req.body);
      return res.status(201).json(plan);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }

  update(req: Request, res: Response) {
    try {
      const plan = dietService.update(req.params.id, req.body);
      return res.json(plan);
    } catch (error) {
      return res.status(404).json({ message: (error as Error).message });
    }
  }
}

export const dietController = new DietController();
