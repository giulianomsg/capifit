import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/user.routes';
import trainerRoutes from '../modules/trainers/trainer.routes';
import studentRoutes from '../modules/students/student.routes';
import workoutRoutes from '../modules/workouts/workout.routes';
import dietRoutes from '../modules/diets/diet.routes';
import assessmentRoutes from '../modules/assessments/assessment.routes';
import communicationRoutes from '../modules/communications/communication.routes';
import subscriptionRoutes from '../modules/subscriptions/subscription.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/trainers', trainerRoutes);
router.use('/students', studentRoutes);
router.use('/workouts', workoutRoutes);
router.use('/diets', dietRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/communications', communicationRoutes);
router.use('/subscriptions', subscriptionRoutes);

export default router;
