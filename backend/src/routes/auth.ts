import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'moneyflow-secret-key-change-in-prod';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password richiesti' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: 'La password deve avere almeno 8 caratteri' });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({ error: 'Email gia registrata' });
    }

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, normalizedEmail, passwordHash);
    db.prepare('INSERT INTO accounts (id, user_id, name, balance) VALUES (?, ?, ?, ?)').run(
      randomUUID(),
      id,
      'Conto Principale',
      0
    );

    const token = jwt.sign({ userId: id, email: normalizedEmail }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id, email: normalizedEmail } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password richiesti' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as any;

    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', requireAuth, (req: AuthRequest, res) => {
  try {
    const user = db.prepare(`
      SELECT id, email, created_at
      FROM users
      WHERE id = ?
    `).get(req.userId!) as { id: string; email: string; created_at: string } | undefined;

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    const workspace = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM transactions t JOIN accounts a ON t.account_id = a.id WHERE a.user_id = ?) as transactionCount,
        (SELECT COUNT(*) FROM budgets WHERE user_id = ?) as budgetCount,
        (SELECT COUNT(*) FROM goals WHERE user_id = ?) as goalCount,
        (SELECT COUNT(*) FROM accounts WHERE user_id = ?) as accountCount
    `).get(req.userId!, req.userId!, req.userId!, req.userId!) as {
      transactionCount: number;
      budgetCount: number;
      goalCount: number;
      accountCount: number;
    };

    res.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      workspace: {
        plan: 'starter',
        transactionCount: workspace.transactionCount,
        budgetCount: workspace.budgetCount,
        goalCount: workspace.goalCount,
        accountCount: workspace.accountCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
