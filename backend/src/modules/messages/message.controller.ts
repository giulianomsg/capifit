import { Request, Response } from 'express';
import { AppError } from '../../errors/AppError';
import { messageService } from './message.service';
import { createMessageSchema, CreateMessageInput } from './message.types';

export class MessageController {
  async listConversation(req: Request, res: Response) {
    const user = req.user!;
    const { studentId } = req.params;

    try {
      const messages = await messageService.listConversation(user, studentId);
      return res.json({ data: messages });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async sendMessage(req: Request, res: Response) {
    const user = req.user!;
    const { studentId } = req.params;

    const parsed = createMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    const payload: CreateMessageInput = {
      content: parsed.data.content,
    };

    try {
      const message = await messageService.sendMessage(
        { id: user.id, role: user.role as 'trainer' | 'student' },
        studentId,
        payload,
      );
      return res.status(201).json({ data: message });
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

export const messageController = new MessageController();
