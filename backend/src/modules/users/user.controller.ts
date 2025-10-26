import { Request, Response } from 'express';
import { userService } from './user.service';

export class UserController {
  list(_req: Request, res: Response) {
    return res.json(userService.list());
  }

  create(req: Request, res: Response) {
    try {
      const user = userService.create(req.body);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }

  getById(req: Request, res: Response) {
    const user = userService.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  }

  update(req: Request, res: Response) {
    try {
      const user = userService.update(req.params.id, req.body);
      return res.json(user);
    } catch (error) {
      return res.status(404).json({ message: (error as Error).message });
    }
  }
}

export const userController = new UserController();
