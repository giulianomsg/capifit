import { Request, Response } from 'express';
import { studentService } from './student.service';

export class StudentController {
  listByTrainer(req: Request, res: Response) {
    const trainerId = req.params.trainerId;
    return res.json(studentService.listByTrainer(trainerId));
  }

  create(req: Request, res: Response) {
    try {
      const student = studentService.create(req.body);
      return res.status(201).json(student);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }

  update(req: Request, res: Response) {
    try {
      const student = studentService.update(req.params.id, req.body);
      return res.json(student);
    } catch (error) {
      return res.status(404).json({ message: (error as Error).message });
    }
  }
}

export const studentController = new StudentController();
