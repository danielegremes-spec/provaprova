import { useEffect } from 'react';
import { useAppStore } from '../store';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { formatCurrency, calculatePercentageChange } from '../lib/utils';
import { TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react';

export function Dashboard() {
  const { summary, setSummary, trend, setTrend, selectedMonth, selectedYear } = useAppStore();

  useEffect(() => {
    api.getSummary().then(setSummary).catch(console.error);
    api.getTrend().then(setTrend).catch(console.error);
  }, [selectedMonth, selectedYear]);

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  const incomeChange = calculatePercentageChange(summary.monthlyIncome, summary.prevMonthlyIncome);
  const expenseChange = calculatePercentageChange(summary.monthlyExpenses, summary.prevMonthlyExpenses);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Totale</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalBalance)}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entrate Mensili</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(summary.monthlyIncome)}</div>
            <p className={`text-xs font-medium ${incomeChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}% dal mese scorso
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Uscite Mensili</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(summary.monthlyExpenses)}</div>
            <p className={`text-xs font-medium ${expenseChange <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}% dal mese scorso
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Risparmio Mensile</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.monthlyIncome - summary.monthlyExpenses >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(summary.monthlyIncome - summary.monthlyExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-foreground">Andamento Ultimi 6 Mesi</CardTitle>
        </CardHeader>
        <CardContent>
          {trend.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nessun dato disponibile
            </div>
          ) : (
            <>
              <div className="h-[300px] flex items-end justify-between gap-2">
                {trend.map((data) => (
                  <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex gap-1 items-end justify-center h-[250px]">
                      <div
                        className="bg-green-500 dark:bg-green-600 rounded-t transition-all hover:opacity-80 cursor-pointer"
                        style={{ height: `${Math.max(10, (data.income / Math.max(...trend.map(t => Math.max(t.income, t.expenses) || 1))) * 100)}%` }}
                        title={`Entrate: ${formatCurrency(data.income)}`}
                      />
                      <div
                        className="bg-red-500 dark:bg-red-600 rounded-t transition-all hover:opacity-80 cursor-pointer"
                        style={{ height: `${Math.max(10, (data.expenses / Math.max(...trend.map(t => Math.max(t.income, t.expenses) || 1))) * 100)}%` }}
                        title={`Uscite: ${formatCurrency(data.expenses)}`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{data.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 dark:bg-green-600 rounded" />
                  <span className="text-sm text-foreground">Entrate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 dark:bg-red-600 rounded" />
                  <span className="text-sm text-foreground">Uscite</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
