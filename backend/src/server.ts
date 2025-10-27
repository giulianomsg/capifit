import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import studentRoutes from './modules/students/student.routes';
import workoutRoutes from './modules/workouts/workout.routes';
import dietRoutes from './modules/diets/diet.routes';
import assessmentRoutes from './modules/assessments/assessment.routes';
import messageRoutes from './modules/messages/message.routes';
import mediaRoutes from './modules/media/media.routes';
import subscriptionRoutes from './modules/subscriptions/subscription.routes';
import { AppError } from './errors/AppError';

const app = express();
app.use(express.json());

const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

const healthHandler = (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api', workoutRoutes);
app.use('/api', dietRoutes);
app.use('/api', assessmentRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api', messageRoutes);
app.use('/api', mediaRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: err.message });
});

const port = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
