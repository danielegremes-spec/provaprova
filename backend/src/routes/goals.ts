import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', (req: AuthRequest, res) => {
  try {
    const goals = db.prepare(`
      SELECT * FROM goals
      WHERE user_id = ?
      ORDER BY target_date ASC
    `).all(req.userId!);
    res.json(goals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req: AuthRequest, res) => {
  try {
    const { name, targetAmount, currentAmount, targetDate } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({ error: 'Nome e importo target richiesti' });
    }

    const id = randomUUID();
    db.prepare(`
      INSERT INTO goals (id, user_id, name, target_amount, current_amount, target_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.userId!, name, targetAmount, currentAmount || 0, targetDate || null);

    const newGoal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
    res.status(201).json(newGoal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { currentAmount } = req.body;

    if (currentAmount !== undefined) {
      db.prepare('UPDATE goals SET current_amount = ? WHERE id = ? AND user_id = ?').run(currentAmount, id, req.userId!);
    }

    const updatedGoal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
    res.json(updatedGoal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(id, req.userId!);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
