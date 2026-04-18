import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', (req: AuthRequest, res) => {
  try {
    const budgets = db.prepare(`
      SELECT b.*, c.name as category_name, c.color as category_color
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ?
      ORDER BY b.start_date DESC
    `).all(req.userId!);
    res.json(budgets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req: AuthRequest, res) => {
  try {
    const { categoryId, amount, period, startDate, endDate } = req.body;

    if (!categoryId || !amount || !startDate) {
      return res.status(400).json({ error: 'Categoria, importo e data inizio richiesti' });
    }

    const id = randomUUID();
    db.prepare(`
      INSERT INTO budgets (id, user_id, category_id, amount, period, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.userId!, categoryId, amount, period || 'monthly', startDate, endDate || null);

    const newBudget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
    res.status(201).json(newBudget);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(id, req.userId!);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
