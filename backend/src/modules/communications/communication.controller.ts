import { Request, Response } from 'express';
import { communicationService } from './communication.service';

export class CommunicationController {
  listMessages(req: Request, res: Response) {
    const roomId = req.params.roomId;
    return res.json(communicationService.listMessages(roomId));
  }

  sendMessage(req: Request, res: Response) {
    try {
      const message = communicationService.sendMessage(req.body);
      return res.status(201).json(message);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }

  listNotifications(req: Request, res: Response) {
    const userId = req.params.userId;
    return res.json(communicationService.listNotifications(userId));
  }

  createNotification(req: Request, res: Response) {
    try {
      const notification = communicationService.createNotification(req.body);
      return res.status(201).json(notification);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }
}

export const communicationController = new CommunicationController();
