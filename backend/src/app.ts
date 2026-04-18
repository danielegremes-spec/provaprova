import cors from 'cors';
import express from 'express';
import { initDb } from './db';
import analyticsRoutes from './routes/analytics';
import authRoutes from './routes/auth';
import budgetRoutes from './routes/budgets';
import goalRoutes from './routes/goals';
import transactionRoutes from './routes/transactions';

const app = express();

initDb();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

export default app;
