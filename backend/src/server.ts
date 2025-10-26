// src/server.ts
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';

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

// exemplo de rota de healthcheck
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// tratador básico de erros
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const port = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
