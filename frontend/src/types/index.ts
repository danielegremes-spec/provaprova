export interface User {
  id: string;
  email: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  category_id: string | null;
  amount: number;
  type: 'income' | 'expense';
  description: string | null;
  date: string;
  currency: string;
  exchange_rate: number;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  account_name?: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  is_default: number;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: string;
  start_date: string;
  end_date: string | null;
  category_name?: string;
  category_color?: string;
  spent?: number;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
}

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  prevMonthlyIncome: number;
  prevMonthlyExpenses: number;
}

export interface CategoryBreakdown {
  name: string;
  color: string;
  type: string;
  total: number;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}
