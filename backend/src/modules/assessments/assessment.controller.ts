import { Request, Response } from 'express';
import { assessmentService } from './assessment.service';

export class AssessmentController {
  listPhysical(req: Request, res: Response) {
    const studentId = req.params.studentId;
    return res.json(assessmentService.listPhysical(studentId));
  }

  listSnapshots(req: Request, res: Response) {
    const studentId = req.params.studentId;
    return res.json(assessmentService.listSnapshots(studentId));
  }

  createPhysical(req: Request, res: Response) {
    try {
      const record = assessmentService.createPhysical(req.body);
      return res.status(201).json(record);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }

  createSnapshot(req: Request, res: Response) {
    try {
      const record = assessmentService.createSnapshot(req.body);
      return res.status(201).json(record);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }
}

export const assessmentController = new AssessmentController();
