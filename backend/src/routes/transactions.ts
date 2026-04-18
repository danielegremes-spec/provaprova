import { Router, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';

const router = Router();

interface AuthRequest extends Request {
  userId?: string;
}

function authMiddleware(req: AuthRequest, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token non fornito' });
  }
  // Per semplicità, prendiamo il primo utente se non c'è auth reale
  const user: any = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!user) {
    return res.status(401).json({ error: 'Nessun utente registrato' });
  }
  req.userId = user.id;
  next();
}

router.use(authMiddleware);

// GET tutte le transazioni
router.get('/', (req: AuthRequest, res) => {
  try {
    const { month, year, type } = req.query as any;

    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon, a.name as account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = ?
    `;
    const params: any[] = [req.userId!];

    if (month && year) {
      query += ` AND strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?`;
      params.push(month.toString().padStart(2, '0'), year.toString());
    }

    if (type) {
      query += ` AND t.type = ?`;
      params.push(type);
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC';

    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST nuova transazione
router.post('/', (req: AuthRequest, res) => {
  try {
    const { accountId, categoryId, amount, type, description, date, currency, exchangeRate } = req.body;

    if (!amount || !type || !date) {
      return res.status(400).json({ error: 'Importo, tipo e data sono richiesti' });
    }

    const id = uuidv4();
    const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(accountId, req.userId!) as any;

    if (!account) {
      // Prendi il primo account dell'utente
      const defaultAccount: any = db.prepare('SELECT id FROM accounts WHERE user_id = ?').get(req.userId!);
      if (!defaultAccount) {
        return res.status(400).json({ error: 'Nessun account trovato' });
      }
      req.body.accountId = defaultAccount.id;
    }

    const balanceChange = type === 'income' ? amount : -amount;

    const stmt = db.prepare(`
      INSERT INTO transactions (id, account_id, category_id, amount, type, description, date, currency, exchange_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, req.body.accountId || account?.id, categoryId, amount, type, description || null, date, currency || 'EUR', exchangeRate || 1.0);

    // Aggiorna bilancio account
    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(balanceChange, req.body.accountId || account?.id);

    const newTransaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    res.status(201).json(newTransaction);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT modifica transazione
router.put('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { amount, type, description, date, categoryId } = req.body;

    const transaction: any = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transazione non trovata' });
    }

    const oldBalanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
    const newBalanceChange = type === 'income' ? amount : -amount;
    const netChange = newBalanceChange - oldBalanceChange;

    db.prepare(`
      UPDATE transactions
      SET amount = ?, type = ?, description = ?, date = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(amount, type, description, date, categoryId, id);

    // Aggiorna bilancio account
    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(netChange, transaction.account_id);

    const updatedTransaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    res.json(updatedTransaction);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE transazione
router.delete('/:id', (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const transaction: any = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transazione non trovata' });
    }

    const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;

    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(balanceChange, transaction.account_id);

    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET categorie
router.get('/categories', (req: AuthRequest, res) => {
  try {
    const categories = db.prepare(`
      SELECT * FROM categories
      WHERE user_id = ? OR is_default = 1
      ORDER BY type, name
    `).all(req.userId!);
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
