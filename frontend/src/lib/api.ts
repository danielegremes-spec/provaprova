import { AiAdvice, AnalyticsInsights, DashboardSummary, User, Workspace } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    });
  } catch {
    throw new Error('Impossibile contattare il server. Riprova tra qualche secondo.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Errore richiesta' }));
    throw new Error(error.error || 'Errore richiesta');
  }

  return response.json();
}

export const api = {
  // Auth
  register: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ user: User; workspace: Workspace }>('/auth/me'),

  // Transactions
  getTransactions: (month?: number, year?: number, type?: string) => {
    const params = new URLSearchParams();
    if (month) params.set('month', month.toString());
    if (year) params.set('year', year.toString());
    if (type) params.set('type', type);
    return request<any[]>(`/transactions?${params}`);
  },

  createTransaction: (data: {
    amount: number;
    type: 'income' | 'expense';
    description?: string;
    date: string;
    categoryId?: string;
    currency?: string;
  }) => request<any>('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateTransaction: (id: string, data: Partial<{
    amount: number;
    type: 'income' | 'expense';
    description: string;
    date: string;
    categoryId: string;
  }>) => request<any>(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteTransaction: (id: string) => request<void>(`/transactions/${id}`, {
    method: 'DELETE',
  }),

  getCategories: () => request<any[]>('/transactions/categories'),

  // Budgets
  getBudgets: () => request<any[]>('/budgets'),
  createBudget: (data: { categoryId: string; amount: number; period: string; startDate: string }) =>
    request<any>('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteBudget: (id: string) => request<void>(`/budgets/${id}`, { method: 'DELETE' }),

  // Goals
  getGoals: () => request<any[]>('/goals'),
  createGoal: (data: { name: string; targetAmount: number; currentAmount?: number; targetDate?: string }) =>
    request<any>('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateGoal: (id: string, data: { currentAmount: number }) =>
    request<any>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteGoal: (id: string) => request<void>(`/goals/${id}`, { method: 'DELETE' }),

  // Analytics
  getSummary: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set('month', month.toString());
    if (year) params.set('year', year.toString());
    return request<DashboardSummary>(`/analytics/summary?${params}`);
  },
  getInsights: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set('month', month.toString());
    if (year) params.set('year', year.toString());
    return request<AnalyticsInsights>(`/analytics/insights?${params}`);
  },
  getAdvice: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set('month', month.toString());
    if (year) params.set('year', year.toString());
    return request<AiAdvice>(`/analytics/advice?${params}`);
  },
  getCategoryBreakdown: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set('month', month.toString());
    if (year) params.set('year', year.toString());
    return request<any[]>(`/analytics/categories?${params}`);
  },
  getTrend: () => request<any[]>('/analytics/trend'),
};
