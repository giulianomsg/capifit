import { Request, Response, Router } from 'express';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { studentController } from './student.controller';

const router = Router();

router.use(authGuard());

router.get('/', roleGuard(['admin', 'trainer']), (req: Request, res: Response) => studentController.list(req, res));
router.post('/', roleGuard(['trainer']), (req: Request, res: Response) => studentController.create(req, res));
router.get('/:id', roleGuard(['admin', 'trainer', 'student']), (req: Request, res: Response) => studentController.show(req, res));
router.patch('/:id', roleGuard(['admin', 'trainer', 'student']), (req: Request, res: Response) => studentController.update(req, res));
router.delete('/:id', roleGuard(['admin', 'trainer']), (req: Request, res: Response) => studentController.remove(req, res));

export default router;
