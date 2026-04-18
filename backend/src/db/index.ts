import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const defaultDbPath = process.env.VERCEL
  ? '/tmp/moneyflow.db'
  : path.join(__dirname, '../../data/moneyflow.db');

const dbPath = process.env.DATABASE_PATH || defaultDbPath;

if (!process.env.VERCEL) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const sqlite = new Database(dbPath);
export const db: Database.Database = sqlite;

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      currency TEXT DEFAULT 'EUR',
      balance INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      color TEXT NOT NULL,
      icon TEXT,
      is_default INTEGER DEFAULT 0
    )
  `);

  // Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      description TEXT,
      date DATE NOT NULL,
      currency TEXT DEFAULT 'EUR',
      exchange_rate REAL DEFAULT 1.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Budgets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      period TEXT DEFAULT 'monthly',
      start_date DATE NOT NULL,
      end_date DATE
    )
  `);

  // Goals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      target_amount INTEGER NOT NULL,
      current_amount INTEGER DEFAULT 0,
      target_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default categories
  const defaultCategories = [
    { id: 'cat_salary', name: 'Stipendio', type: 'income', color: '#22c55e', icon: 'wallet' },
    { id: 'cat_freelance', name: 'Freelance', type: 'income', color: '#16a34a', icon: 'briefcase' },
    { id: 'cat_investments', name: 'Investimenti', type: 'income', color: '#15803d', icon: 'trending-up' },
    { id: 'cat_food', name: 'Alimentari', type: 'expense', color: '#ef4444', icon: 'shopping-cart' },
    { id: 'cat_transport', name: 'Trasporti', type: 'expense', color: '#f97316', icon: 'car' },
    { id: 'cat_utilities', name: 'Bollette', type: 'expense', color: '#eab308', icon: 'zap' },
    { id: 'cat_entertainment', name: 'Intrattenimento', type: 'expense', color: '#8b5cf6', icon: 'film' },
    { id: 'cat_shopping', name: 'Shopping', type: 'expense', color: '#ec4899', icon: 'bag' },
    { id: 'cat_health', name: 'Salute', type: 'expense', color: '#06b6d4', icon: 'heart' },
    { id: 'cat_home', name: 'Casa', type: 'expense', color: '#6366f1', icon: 'home' },
    { id: 'cat_education', name: 'Istruzione', type: 'expense', color: '#14b8a6', icon: 'book' },
    { id: 'cat_other', name: 'Altro', type: 'expense', color: '#6b7280', icon: 'more' },
  ];

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (id, name, type, color, icon, is_default)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const insertMany = db.transaction((cats) => {
    for (const cat of cats) {
      insertCategory.run(cat.id, cat.name, cat.type, cat.color, cat.icon);
    }
  });

  insertMany(defaultCategories);

  console.log('Database initialized successfully');
}
