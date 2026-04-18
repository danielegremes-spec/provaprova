import { Router } from 'express';
import { db } from '../db';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/summary', (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const account: any = db.prepare('SELECT SUM(balance) as total FROM accounts WHERE user_id = ?').get(req.userId!);

    const monthlyStats: any = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = ? AND strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?
    `).get(req.userId!, currentMonth.toString().padStart(2, '0'), currentYear.toString());

    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevDate.getMonth() + 1;
    const prevYear = prevDate.getFullYear();

    const prevMonthlyStats: any = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = ? AND strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?
    `).get(req.userId!, prevMonth.toString().padStart(2, '0'), prevYear.toString());

    res.json({
      totalBalance: account?.total || 0,
      monthlyIncome: monthlyStats?.income || 0,
      monthlyExpenses: monthlyStats?.expenses || 0,
      prevMonthlyIncome: prevMonthlyStats?.income || 0,
      prevMonthlyExpenses: prevMonthlyStats?.expenses || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories', (req: AuthRequest, res) => {
  try {
    const { month, year } = req.query as any;
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const breakdown = db.prepare(`
      SELECT
        c.name,
        c.color,
        c.type,
        COALESCE(SUM(t.amount), 0) as total,
        COUNT(t.id) as count
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = ?
        AND strftime('%m', t.date) = ?
        AND strftime('%Y', t.date) = ?
      GROUP BY c.id, c.name, c.color, c.type
      ORDER BY total DESC
    `).all(req.userId!, targetMonth.toString().padStart(2, '0'), targetYear.toString());

    res.json(breakdown);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/trend', (req: AuthRequest, res) => {
  try {
    const trend = db.prepare(`
      SELECT
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = ?
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
      LIMIT 6
    `).all(req.userId!).reverse();

    res.json(trend);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
