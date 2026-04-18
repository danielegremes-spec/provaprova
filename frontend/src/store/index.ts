import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AnalyticsInsights,
  Budget,
  Category,
  CategoryBreakdown,
  DashboardSummary,
  Goal,
  MonthlyTrend,
  Transaction,
  User,
  Workspace,
} from '../types';

interface AppState {
  // Auth
  token: string | null;
  user: User | null;
  workspace: Workspace | null;
  isAuthenticated: boolean;

  // Data
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  summary: DashboardSummary | null;
  insights: AnalyticsInsights | null;
  categoryBreakdown: CategoryBreakdown[];
  trend: MonthlyTrend[];

  // UI
  darkMode: boolean;
  selectedMonth: number;
  selectedYear: number;

  // Actions
  setAuth: (token: string, user: User) => void;
  setWorkspace: (workspace: Workspace | null) => void;
  logout: () => void;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setCategories: (categories: Category[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  setSummary: (summary: DashboardSummary) => void;
  setInsights: (insights: AnalyticsInsights | null) => void;
  setCategoryBreakdown: (breakdown: CategoryBreakdown[]) => void;
  setTrend: (trend: MonthlyTrend[]) => void;
  toggleDarkMode: () => void;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      token: null,
      user: null,
      workspace: null,
      isAuthenticated: false,
      transactions: [],
      categories: [],
      budgets: [],
      goals: [],
      summary: null,
      insights: null,
      categoryBreakdown: [],
      trend: [],
      darkMode: false,
      selectedMonth: new Date().getMonth() + 1,
      selectedYear: new Date().getFullYear(),

      // Auth actions
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      setWorkspace: (workspace) => set({ workspace }),
      logout: () => set({
        token: null,
        user: null,
        workspace: null,
        isAuthenticated: false,
        transactions: [],
        budgets: [],
        goals: [],
        summary: null,
        insights: null,
      }),

      // Transactions
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (transaction) => set((state) => ({ transactions: [transaction, ...state.transactions] })),
      updateTransaction: (id, data) => set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...data } : t)),
      })),
      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      })),

      // Categories
      setCategories: (categories) => set({ categories }),

      // Budgets
      setBudgets: (budgets) => set({ budgets }),
      addBudget: (budget) => set((state) => ({ budgets: [...state.budgets, budget] })),
      deleteBudget: (id) => set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) })),

      // Goals
      setGoals: (goals) => set({ goals }),
      addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
      updateGoal: (id, data) => set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, ...data } : g)),
      })),
      deleteGoal: (id) => set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),

      // Analytics
      setSummary: (summary) => set({ summary }),
      setInsights: (insights) => set({ insights }),
      setCategoryBreakdown: (breakdown) => set({ categoryBreakdown: breakdown }),
      setTrend: (trend) => set({ trend }),

      // UI
      toggleDarkMode: () => set((state) => {
        document.documentElement.classList.toggle('dark');
        return { darkMode: !state.darkMode };
      }),
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      setSelectedYear: (year) => set({ selectedYear: year }),
    }),
    {
      name: 'moneyflow-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        workspace: state.workspace,
        isAuthenticated: state.isAuthenticated,
        darkMode: state.darkMode,
      }),
    }
  )
);
