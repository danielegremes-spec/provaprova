import express from 'express';
import cors from 'cors';
import { initDb } from './db';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import budgetRoutes from './routes/budgets';
import goalRoutes from './routes/goals';
import analyticsRoutes from './routes/analytics';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message });
});

// Init database and start server
initDb();
app.listen(PORT, () => {
  console.log(`MoneyFlow backend running on http://localhost:${PORT}`);
});

export default app;
