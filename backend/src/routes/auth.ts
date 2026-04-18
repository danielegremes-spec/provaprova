import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'moneyflow-secret-key-change-in-prod';

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password richiesti' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email già registrata' });
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, email, passwordHash);

    // Crea account default
    db.prepare('INSERT INTO accounts (id, user_id, name, balance) VALUES (?, ?, ?, ?)').run(
      uuidv4(),
      id,
      'Conto Principale',
      0
    );

    const token = jwt.sign({ userId: id, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id, email } });
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

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
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

export default router;
