import { Request, Response } from 'express';
import { AppError } from '../../errors/AppError';
import { assessmentService } from './assessment.service';
import { createAssessmentSchema, updateAssessmentSchema } from './assessment.types';

export class AssessmentController {
  async list(req: Request, res: Response) {
    const user = req.user!;
    const { studentId } = req.params;

    try {
      if (user.role === 'admin') {
        const assessments = await assessmentService.listForAdmin(studentId);
        return res.json({ data: assessments });
      }

      if (user.role === 'trainer') {
        const assessments = await assessmentService.listForTrainer(user.id, studentId);
        return res.json({ data: assessments });
      }

      if (user.role === 'student') {
        const assessments = await assessmentService.listForStudent(user.id, studentId);
        return res.json({ data: assessments });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async create(req: Request, res: Response) {
    const user = req.user!;
    const { studentId } = req.params;
    const parsed = createAssessmentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    try {
      const assessment = await assessmentService.createForTrainer(user.id, studentId, parsed.data);
      return res.status(201).json({ data: assessment });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async show(req: Request, res: Response) {
    const user = req.user!;
    const { id } = req.params;

    try {
      if (user.role === 'admin') {
        const assessment = await assessmentService.getForAdmin(id);
        return res.json({ data: assessment });
      }

      if (user.role === 'trainer') {
        const assessment = await assessmentService.getForTrainer(user.id, id);
        return res.json({ data: assessment });
      }

      if (user.role === 'student') {
        const assessment = await assessmentService.getForStudent(user.id, id);
        return res.json({ data: assessment });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    const user = req.user!;
    const { id } = req.params;
    const parsed = updateAssessmentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    try {
      const assessment = await assessmentService.updateForTrainer(user.id, id, parsed.data);
      return res.json({ data: assessment });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    const user = req.user!;
    const { id } = req.params;

    try {
      await assessmentService.deleteForTrainer(user.id, id);
      return res.status(204).send();
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

export const assessmentController = new AssessmentController();
