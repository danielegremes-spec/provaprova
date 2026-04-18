import { Router } from 'express';
import { db } from '../db';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

function parsePeriod(month?: string, year?: string) {
  const now = new Date();
  const selectedMonth = Number(month) || now.getMonth() + 1;
  const selectedYear = Number(year) || now.getFullYear();

  return {
    month: selectedMonth,
    year: selectedYear,
    monthKey: String(selectedMonth).padStart(2, '0'),
    yearKey: String(selectedYear),
  };
}

function getMonthlySummary(userId: string, monthKey: string, yearKey: string) {
  return db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as expenses,
      COUNT(t.id) as transactionCount
    FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    WHERE a.user_id = ? AND strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?
  `).get(userId, monthKey, yearKey) as {
    income: number;
    expenses: number;
    transactionCount: number;
  };
}

router.get('/summary', (req: AuthRequest, res) => {
  try {
    const period = parsePeriod(req.query.month as string | undefined, req.query.year as string | undefined);
    const previousDate = new Date(period.year, period.month - 2, 1);
    const previousMonthKey = String(previousDate.getMonth() + 1).padStart(2, '0');
    const previousYearKey = String(previousDate.getFullYear());

    const account: any = db.prepare('SELECT COALESCE(SUM(balance), 0) as total FROM accounts WHERE user_id = ?').get(req.userId!);

    const monthlyStats: any = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = ? AND strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?
    `).get(req.userId!, period.monthKey, period.yearKey);

    const prevMonthlyStats: any = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = ? AND strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?
    `).get(req.userId!, previousMonthKey, previousYearKey);

    const monthlyIncome = monthlyStats?.income || 0;
    const monthlyExpenses = monthlyStats?.expenses || 0;
    const monthlySavings = monthlyIncome - monthlyExpenses;

    res.json({
      totalBalance: account?.total || 0,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      savingsRate: monthlyIncome > 0 ? monthlySavings / monthlyIncome : 0,
      prevMonthlyIncome: prevMonthlyStats?.income || 0,
      prevMonthlyExpenses: prevMonthlyStats?.expenses || 0,
      month: period.month,
      year: period.year,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/insights', (req: AuthRequest, res) => {
  try {
    const period = parsePeriod(req.query.month as string | undefined, req.query.year as string | undefined);

    const summary = getMonthlySummary(req.userId!, period.monthKey, period.yearKey);

    const topExpenseCategory = db.prepare(`
      SELECT
        c.name,
        c.color,
        COALESCE(SUM(t.amount), 0) as total
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE a.user_id = ?
        AND t.type = 'expense'
        AND strftime('%m', t.date) = ?
        AND strftime('%Y', t.date) = ?
      GROUP BY c.id, c.name, c.color
      ORDER BY total DESC
      LIMIT 1
    `).get(req.userId!, period.monthKey, period.yearKey) as
      | { name: string | null; color: string | null; total: number }
      | undefined;

    const budgetRows = db.prepare(`
      SELECT
        b.id,
        b.amount,
        b.category_id,
        c.name as category_name,
        COALESCE(SUM(
          CASE
            WHEN t.type = 'expense' AND strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?
            THEN t.amount
            ELSE 0
          END
        ), 0) as spent
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN accounts a ON a.user_id = b.user_id
      LEFT JOIN transactions t ON t.account_id = a.id AND t.category_id = b.category_id
      WHERE b.user_id = ?
      GROUP BY b.id, b.amount, b.category_id, c.name
    `).all(period.monthKey, period.yearKey, req.userId!) as Array<{
      id: string;
      amount: number;
      category_id: string;
      category_name: string | null;
      spent: number;
    }>;

    const account: any = db.prepare('SELECT COALESCE(SUM(balance), 0) as totalBalance FROM accounts WHERE user_id = ?').get(req.userId!);
    const goals = db.prepare('SELECT target_amount, current_amount FROM goals WHERE user_id = ?').all(req.userId!) as Array<{
      target_amount: number;
      current_amount: number;
    }>;

    const expenses = summary?.expenses || 0;
    const income = summary?.income || 0;
    const savingsRate = income > 0 ? (income - expenses) / income : 0;
    const averageDailySpend = expenses / 30;
    const runwayDays = averageDailySpend > 0 ? Math.round((account?.totalBalance || 0) / averageDailySpend) : null;
    const criticalBudgets = budgetRows.filter((budget) => budget.amount > 0 && budget.spent / budget.amount >= 0.8);
    const overBudgetCount = budgetRows.filter((budget) => budget.amount > 0 && budget.spent > budget.amount).length;
    const averageGoalProgress = goals.length
      ? goals.reduce((total, goal) => total + Math.min(goal.current_amount / goal.target_amount, 1), 0) / goals.length
      : 0;

    const healthScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          45 +
            savingsRate * 35 +
            Math.min(20, averageGoalProgress * 20) -
            overBudgetCount * 12 +
            Math.min(15, ((account?.totalBalance || 0) / 10000))
        )
      )
    );

    const smartActions: string[] = [];
    if (savingsRate < 0) smartActions.push('Le spese hanno superato le entrate: prova a ridurre la categoria piu pesante questa settimana.');
    if (criticalBudgets.length > 0) smartActions.push(`Hai ${criticalBudgets.length} budget vicini al limite: anticipare una revisione evita sforamenti a fine mese.`);
    if (topExpenseCategory?.name) smartActions.push(`La categoria piu impattante e ${topExpenseCategory.name}: e il primo posto dove recuperare margine.`);
    if (goals.length === 0) smartActions.push('Aggiungi almeno un obiettivo di risparmio: aumenta il focus e rende la dashboard piu strategica.');
    if (smartActions.length === 0) smartActions.push('Il mese e sotto controllo: puoi alzare un budget o accelerare un obiettivo senza stressare la cassa.');

    res.json({
      healthScore,
      savingsRate,
      averageDailySpend,
      runwayDays,
      budgetAlerts: criticalBudgets.map((budget) => ({
        id: budget.id,
        categoryName: budget.category_name || 'Categoria',
        spent: budget.spent,
        budgeted: budget.amount,
        progress: budget.amount > 0 ? budget.spent / budget.amount : 0,
      })),
      topExpenseCategory: topExpenseCategory
        ? {
            name: topExpenseCategory.name || 'Senza categoria',
            color: topExpenseCategory.color || '#6b7280',
            total: topExpenseCategory.total,
            share: expenses > 0 ? topExpenseCategory.total / expenses : 0,
          }
        : null,
      smartActions,
      transactionCount: summary?.transactionCount || 0,
      averageGoalProgress,
      month: period.month,
      year: period.year,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/advice', (req: AuthRequest, res) => {
  try {
    const period = parsePeriod(req.query.month as string | undefined, req.query.year as string | undefined);
    const previousDate = new Date(period.year, period.month - 2, 1);
    const previousMonthKey = String(previousDate.getMonth() + 1).padStart(2, '0');
    const previousYearKey = String(previousDate.getFullYear());
    const summary = getMonthlySummary(req.userId!, period.monthKey, period.yearKey);
    const previousSummary = getMonthlySummary(req.userId!, previousMonthKey, previousYearKey);

    const topExpenseCategory = db.prepare(`
      SELECT
        c.name,
        c.color,
        COALESCE(SUM(t.amount), 0) as total
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE a.user_id = ?
        AND t.type = 'expense'
        AND strftime('%m', t.date) = ?
        AND strftime('%Y', t.date) = ?
      GROUP BY c.id, c.name, c.color
      ORDER BY total DESC
      LIMIT 1
    `).get(req.userId!, period.monthKey, period.yearKey) as
      | { name: string | null; color: string | null; total: number }
      | undefined;

    const budgetRows = db.prepare(`
      SELECT
        b.id,
        b.amount,
        c.name as category_name,
        COALESCE(SUM(
          CASE
            WHEN t.type = 'expense' AND strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?
            THEN t.amount
            ELSE 0
          END
        ), 0) as spent
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN accounts a ON a.user_id = b.user_id
      LEFT JOIN transactions t ON t.account_id = a.id AND t.category_id = b.category_id
      WHERE b.user_id = ?
      GROUP BY b.id, b.amount, c.name
    `).all(period.monthKey, period.yearKey, req.userId!) as Array<{
      id: string;
      amount: number;
      category_name: string | null;
      spent: number;
    }>;

    const goals = db.prepare('SELECT name, target_amount, current_amount FROM goals WHERE user_id = ?').all(req.userId!) as Array<{
      name: string;
      target_amount: number;
      current_amount: number;
    }>;

    const income = summary.income || 0;
    const expenses = summary.expenses || 0;
    const savings = income - expenses;
    const savingsRate = income > 0 ? savings / income : 0;
    const expenseDelta = previousSummary.expenses > 0
      ? (expenses - previousSummary.expenses) / previousSummary.expenses
      : 0;
    const topShare = expenses > 0 && topExpenseCategory ? topExpenseCategory.total / expenses : 0;
    const criticalBudgets = budgetRows.filter((row) => row.amount > 0 && row.spent / row.amount >= 0.85);
    const overBudget = budgetRows.filter((row) => row.amount > 0 && row.spent > row.amount);
    const weakestGoal = goals
      .map((goal) => ({
        ...goal,
        progress: goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0,
      }))
      .sort((left, right) => left.progress - right.progress)[0];

    const items: Array<{
      id: string;
      kind: 'cashflow' | 'budget' | 'spending' | 'goal' | 'opportunity';
      priority: 'high' | 'medium' | 'low';
      title: string;
      summary: string;
      action: string;
      confidence: number;
    }> = [];

    if (income > 0 && expenses > income) {
      items.push({
        id: 'cashflow-gap',
        kind: 'cashflow',
        priority: 'high',
        title: 'Stai bruciando piu cassa di quanta ne entra',
        summary: `Nel periodo selezionato hai speso ${Math.round((expenses / income) * 100)}% delle entrate e il risparmio e negativo.`,
        action: 'Congela una categoria non essenziale per 7 giorni e punta a riportare il saving rate almeno sopra il 10%.',
        confidence: 0.94,
      });
    }

    if (criticalBudgets.length > 0) {
      items.push({
        id: 'budget-pressure',
        kind: 'budget',
        priority: overBudget.length > 0 ? 'high' : 'medium',
        title: 'Ci sono budget sotto pressione',
        summary: `${criticalBudgets.length} budget sono oltre l 85% e ${overBudget.length} hanno gia sforato il limite.`,
        action: `Rivedi per primo ${criticalBudgets[0].category_name || 'il budget piu teso'} e limita nuove spese fino al reset del mese.`,
        confidence: 0.91,
      });
    }

    if (topExpenseCategory && topShare >= 0.35) {
      items.push({
        id: 'category-concentration',
        kind: 'spending',
        priority: 'medium',
        title: 'Una sola categoria assorbe troppo del mese',
        summary: `${topExpenseCategory.name || 'Una categoria'} pesa il ${(topShare * 100).toFixed(1)}% delle tue uscite mensili.`,
        action: `Imposta un micro-target: taglia del 10% ${topExpenseCategory.name || 'questa categoria'} per liberare margine senza stravolgere il sistema.`,
        confidence: 0.88,
      });
    }

    if (expenseDelta > 0.15) {
      items.push({
        id: 'expense-trend-up',
        kind: 'spending',
        priority: 'medium',
        title: 'Le uscite stanno accelerando rispetto al mese scorso',
        summary: `Le spese sono salite del ${(expenseDelta * 100).toFixed(1)}% rispetto al periodo precedente.`,
        action: 'Controlla le spese ricorrenti e individua almeno una voce da riportare al livello del mese scorso.',
        confidence: 0.84,
      });
    }

    if (weakestGoal && weakestGoal.progress < 0.3) {
      items.push({
        id: 'goal-stall',
        kind: 'goal',
        priority: 'low',
        title: 'Un obiettivo di risparmio e quasi fermo',
        summary: `${weakestGoal.name} e al ${Math.round(weakestGoal.progress * 100)}% del target.`,
        action: 'Trasforma l obiettivo in una rata mensile automatica piu piccola ma costante.',
        confidence: 0.79,
      });
    } else if (goals.length === 0) {
      items.push({
        id: 'goal-missing',
        kind: 'goal',
        priority: 'low',
        title: 'Ti manca un obiettivo guida',
        summary: 'Senza un target concreto e piu difficile capire se il risparmio di oggi sta costruendo qualcosa.',
        action: 'Crea un obiettivo a 90 giorni con target realistico e aggiorna i progressi ogni settimana.',
        confidence: 0.75,
      });
    }

    if (items.length === 0 || savingsRate >= 0.2) {
      items.push({
        id: 'growth-opportunity',
        kind: 'opportunity',
        priority: items.length === 0 ? 'medium' : 'low',
        title: 'Hai spazio per una mossa di qualità',
        summary: savingsRate >= 0.2
          ? `Il tuo saving rate e ${(savingsRate * 100).toFixed(1)}%, sopra una soglia molto sana.`
          : 'Non emergono criticita forti nel periodo selezionato.',
        action: 'Valuta di automatizzare un trasferimento verso un fondo emergenze o un obiettivo ad alta priorita.',
        confidence: 0.72,
      });
    }

    const sortedItems = items.sort((left, right) => {
      const priorityRank = { high: 3, medium: 2, low: 1 };
      return priorityRank[right.priority] - priorityRank[left.priority];
    });

    const overview = sortedItems[0]?.summary || 'I tuoi dati sono stabili: nessuna anomalia rilevante.';
    const nextBestAction = sortedItems[0]?.action || 'Continua a monitorare entrate, uscite e budget per consolidare il ritmo.';

    res.json({
      overview,
      nextBestAction,
      generatedAt: new Date().toISOString(),
      items: sortedItems,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories', (req: AuthRequest, res) => {
  try {
    const period = parsePeriod(req.query.month as string | undefined, req.query.year as string | undefined);

    const breakdown = db.prepare(`
      SELECT
        c.name,
        c.color,
        c.type,
        COALESCE(SUM(t.amount), 0) as total,
        COUNT(t.id) as count
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE a.user_id = ?
        AND strftime('%m', t.date) = ?
        AND strftime('%Y', t.date) = ?
      GROUP BY c.id, c.name, c.color, c.type
      ORDER BY total DESC
    `).all(req.userId!, period.monthKey, period.yearKey);

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
